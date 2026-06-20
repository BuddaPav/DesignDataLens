/**
 * Одним проходом применяет массив последствий выбора к состоянию игрока (без React).
 * Сторонние эффекты: `story_flag` → MemorySystem; дельты отношений и смерть NPC → `ChoiceBatchSideEffects` (применяет `useGameState` + NPCSystem).
 */
import type { Consequence, Player, Quest, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n/index';
import { t } from '@/i18n/index';
import {
  addStackableTemplateItem,
  clampGold,
  removeStackableTemplateItem,
} from '@/domain/inventory/inventoryRules';
import {
  formatStoryReputationChoiceLogLine,
  isCoreFactionId,
  mergeFactionReputation,
} from '@/domain/social/factionReputationRules';
import { pushWorldLog } from '@/engine/worldEvents';
import {
  generateDialogueFollowupQuest,
  isDialogueFollowupQuestId,
  parseDialogueFollowupQuestId,
  parseDialogueFollowupUnlockPayload,
} from '@/domain/consequences/generateDialogueFollowupQuest';

export type StoryFlagOp = { key: string; value: unknown };

/** Накапливается в батче; мутации NPC выполняет хук состояния после чистого прохода. */
export type ChoiceBatchSideEffects = {
  npcRelDeltas: Array<{
    npcId: string;
    trust?: number;
    affection?: number;
    respect?: number;
    fear?: number;
  }>;
  npcIdsToMarkDead: string[];
};

const GOLD_LOG_THRESHOLD = 80;
const QUEST_UNLOCK_LOG_THRESHOLD = 1;

type NarrativeDeltaPayload = {
  factionReputationDelta?: Record<string, unknown>;
  locationReputationDelta?: Record<string, unknown>;
  message?: unknown;
  /** id NPC — смерть в нарративе (гриф, казнь, и т.д.) */
  markNpcDead?: unknown;
};

function pushMarkNpcDead(side: ChoiceBatchSideEffects | undefined, raw: unknown): void {
  if (!side) return;
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (id) side.npcIdsToMarkDead.push(id);
}

const LOCATION_REP_MIN = -100;
const LOCATION_REP_MAX = 100;

function normalizeLocationRepKey(rawKey: string): string {
  const k = rawKey.trim();
  if (!k) return '';
  return k.startsWith('location:') ? k : `location:${k}`;
}

function applyLocationReputationDelta(
  p: Player,
  delta: Record<string, unknown>,
  lang: Language,
  log: WorldLogEntry[],
): Player {
  const newReputation = new Map(p.stats.reputation);
  let changed = false;
  for (const [rawKey, rawVal] of Object.entries(delta)) {
    const key = normalizeLocationRepKey(rawKey);
    if (!key) continue;
    const n = asNumber(rawVal, 0);
    if (!Number.isFinite(n) || n === 0) continue;
    const cur = newReputation.get(key) ?? 0;
    newReputation.set(key, Math.max(LOCATION_REP_MIN, Math.min(LOCATION_REP_MAX, cur + n)));
    changed = true;
    const slug = key.slice('location:'.length);
    const line =
      lang === 'ru'
        ? `Окрестности «${slug}» ${n > 0 ? 'теплее' : 'холоднее'} к вам (${n > 0 ? '+' : ''}${Math.round(n)}).`
        : `The vicinity of “${slug}” turns ${n > 0 ? 'warmer' : 'colder'} toward you (${n > 0 ? '+' : ''}${Math.round(n)}).`;
    pushWorldLog(log, line, 'info', 'social');
  }
  if (!changed) return p;
  return {
    ...p,
    stats: { ...p.stats, reputation: newReputation },
    storyProgress: { ...p.storyProgress, worldEventLog: log },
  };
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function formatGoldLogLine(delta: number, lang: Language): string {
  const a = String(Math.abs(Math.round(delta)));
  const key =
    (delta >= 0 ? 'game.log.gold_gain' : 'game.log.gold_loss') as Parameters<typeof t>[0];
  return t(key, lang).replace('{{n}}', a);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}

function applyFactionReputationDelta(
  p: Player,
  delta: Record<string, unknown>,
  lang: Language,
  log: WorldLogEntry[],
): Player {
  const parsed: Record<string, number> = {};
  for (const [k, raw] of Object.entries(delta)) {
    const n = asNumber(raw, 0);
    if (!Number.isFinite(n) || n === 0) continue;
    if (!isCoreFactionId(k)) continue;
    parsed[k] = (parsed[k] ?? 0) + n;
  }
  if (Object.keys(parsed).length === 0) return p;

  const next = mergeFactionReputation(p.storyProgress.factionReputation, parsed);
  for (const [k, d] of Object.entries(parsed)) {
    const line = formatStoryReputationChoiceLogLine(k, d, lang);
    if (line) pushWorldLog(log, line, 'info', 'social');
  }
  return { ...p, storyProgress: { ...p.storyProgress, factionReputation: next, worldEventLog: log } };
}

function makeUnlockedQuestStub(id: string, lang: Language): Quest {
  const title = t('game.log.quest_unlocked_title', lang).replace('{{id}}', id);
  const description = t('game.log.quest_unlocked_desc', lang);
  const parts = id.split(':');
  const inferredLocation =
    parts.length >= 3 && parts[1] && !parts[1].includes(' ')
      ? parts[1]
      : 'starting_village';
  const initialObjective = {
    id: `obj_unlock_${id}`,
    description:
      lang === 'ru'
        ? `Доберитесь до точки: ${inferredLocation}`
        : `Reach destination: ${inferredLocation}`,
    type: 'reach_location' as const,
    target: inferredLocation,
    required: 1,
    current: 0,
    completed: false,
  };
  return {
    id,
    type: 'generated',
    title,
    description,
    objectives: [initialObjective],
    currentObjectiveIndex: 0,
    scenes: [],
    currentSceneIndex: 0,
    status: 'active',
    rewards: [],
    relatedNPCs: [],
    generated: true,
  };
}

/**
 * Применяет все последствия к копии состояния; мутирует только переданный буфер журнала `log`.
 */
export function applyChoiceConsequencesBatch(
  prev: Player,
  consequences: Consequence[],
  lang: Language,
  log: WorldLogEntry[],
  storyFlags: StoryFlagOp[],
  sideEffects: ChoiceBatchSideEffects = { npcRelDeltas: [], npcIdsToMarkDead: [] },
): Player {
  let p = prev;

  for (const consequence of consequences) {
    switch (consequence.type) {
      case 'attribute_change': {
        const delta = asNumber(consequence.value);
        const attrs = p.character.attributes as unknown as Record<string, number>;
        const prevVal = attrs[consequence.key] ?? 0;
        p = {
          ...p,
          character: {
            ...p.character,
            attributes: {
              ...p.character.attributes,
              [consequence.key]: Math.max(1, prevVal + delta),
            },
          },
        };
        break;
      }

      case 'reputation_change': {
        const delta = asNumber(consequence.value);
        const newReputation = new Map(p.stats.reputation);
        const current = newReputation.get(consequence.key) || 0;
        newReputation.set(consequence.key, current + delta);
        const story = isCoreFactionId(consequence.key)
          ? mergeFactionReputation(p.storyProgress.factionReputation, {
              [consequence.key]: delta,
            })
          : p.storyProgress.factionReputation;
        const repLine = formatStoryReputationChoiceLogLine(consequence.key, delta, lang);
        if (repLine) pushWorldLog(log, repLine, 'info', 'social');
        p = {
          ...p,
          stats: { ...p.stats, reputation: newReputation },
          storyProgress: {
            ...p.storyProgress,
            factionReputation: story,
            worldEventLog: log,
          },
        };
        break;
      }

      case 'item_gain': {
        const { inventory, outcome } = addStackableTemplateItem(
          p.inventory,
          consequence.key,
          consequence.value,
        );
        if (outcome !== 'invalid' && outcome !== 'no_capacity') {
          p = { ...p, inventory };
        }
        break;
      }

      case 'item_loss': {
        p = {
          ...p,
          inventory: removeStackableTemplateItem(
            p.inventory,
            consequence.key,
            consequence.value,
          ),
        };
        break;
      }

      case 'gold': {
        const delta = asNumber(consequence.value);
        const nextGold = clampGold(p.inventory.gold + delta);
        if (Math.abs(delta) >= GOLD_LOG_THRESHOLD) {
          pushWorldLog(log, formatGoldLogLine(delta, lang), 'info', 'economy');
        }
        p = {
          ...p,
          inventory: { ...p.inventory, gold: nextGold },
          storyProgress: { ...p.storyProgress, worldEventLog: log },
        };
        break;
      }

      case 'experience': {
        p = {
          ...p,
          character: {
            ...p.character,
            experience: p.character.experience + asNumber(consequence.value),
          },
        };
        break;
      }

      case 'story_flag': {
        storyFlags.push({ key: consequence.key, value: consequence.value });
        break;
      }

      case 'quest_complete': {
        const qid = consequence.key.trim();
        if (!qid) break;
        const completed = p.storyProgress.completedQuests.includes(qid)
          ? p.storyProgress.completedQuests
          : [...p.storyProgress.completedQuests, qid];
        const active = p.storyProgress.activeQuests.filter((q) => q.id !== qid);
        const line = t('game.log.quest_completed', lang).replace('{{id}}', qid);
        pushWorldLog(log, line, 'dramatic', 'general');
        p = {
          ...p,
          storyProgress: {
            ...p.storyProgress,
            completedQuests: completed,
            activeQuests: active,
            worldEventLog: log,
          },
        };
        const payload = asRecord(consequence.value) as NarrativeDeltaPayload | null;
        if (payload?.factionReputationDelta) {
          p = applyFactionReputationDelta(p, payload.factionReputationDelta as Record<string, unknown>, lang, log);
        }
        if (payload?.locationReputationDelta) {
          p = applyLocationReputationDelta(p, payload.locationReputationDelta as Record<string, unknown>, lang, log);
        }
        pushMarkNpcDead(sideEffects, payload?.markNpcDead);
        break;
      }

      case 'world_event': {
        const rec = asRecord(consequence.value) as NarrativeDeltaPayload | null;
        const msg =
          typeof rec?.message === 'string' && rec.message.trim()
            ? rec.message.trim()
            : typeof consequence.value === 'string' && consequence.value.trim()
              ? consequence.value.trim()
              : consequence.key;
        if (msg) pushWorldLog(log, msg, 'dramatic', 'general');

        // Back-compat: numeric value means rep delta for key if key is core faction id.
        const delta = asNumber(consequence.value, 0);
        if (isCoreFactionId(consequence.key) && Math.abs(delta) >= QUEST_UNLOCK_LOG_THRESHOLD) {
          p = applyFactionReputationDelta(p, { [consequence.key]: delta }, lang, log);
        }

        if (rec?.factionReputationDelta) {
          p = applyFactionReputationDelta(p, rec.factionReputationDelta as Record<string, unknown>, lang, log);
        }
        if (rec?.locationReputationDelta) {
          p = applyLocationReputationDelta(p, rec.locationReputationDelta as Record<string, unknown>, lang, log);
        }
        pushMarkNpcDead(sideEffects, rec?.markNpcDead);

        p = { ...p, storyProgress: { ...p.storyProgress, worldEventLog: log } };
        break;
      }

      case 'npc_relationship': {
        const npcId = consequence.key.trim();
        if (!npcId) break;
        const v = asRecord(consequence.value);
        const entry: ChoiceBatchSideEffects['npcRelDeltas'][number] = { npcId };
        if (v) {
          const td = asNumber(v.trust, NaN);
          const ad = asNumber(v.affection, NaN);
          const rd = asNumber(v.respect, NaN);
          const fd = asNumber(v.fear, NaN);
          if (Number.isFinite(td)) entry.trust = td;
          if (Number.isFinite(ad)) entry.affection = ad;
          if (Number.isFinite(rd)) entry.respect = rd;
          if (Number.isFinite(fd)) entry.fear = fd;
        }
        if (
          entry.trust !== undefined ||
          entry.affection !== undefined ||
          entry.respect !== undefined ||
          entry.fear !== undefined
        ) {
          sideEffects.npcRelDeltas.push(entry);
        }
        break;
      }

      case 'npc_mark_dead': {
        pushMarkNpcDead(sideEffects, consequence.key);
        break;
      }

      case 'quest_unlock': {
        const qid = consequence.key.trim();
        if (!qid) break;
        const already =
          p.storyProgress.activeQuests.some((q) => q.id === qid) ||
          p.storyProgress.completedQuests.includes(qid);
        if (already) break;
        const followupMeta = isDialogueFollowupQuestId(qid) ? parseDialogueFollowupQuestId(qid) : null;
        const followupPayload = followupMeta
          ? parseDialogueFollowupUnlockPayload(consequence.value)
          : null;
        const questStub = followupMeta
          ? generateDialogueFollowupQuest({
              questId: qid,
              locationId: followupMeta.locationId,
              npcId: followupPayload?.npcId,
              tags: followupPayload?.tags,
              lang,
            })
          : makeUnlockedQuestStub(qid, lang);
        pushWorldLog(log, t('game.log.quest_unlocked', lang).replace('{{id}}', questStub.title), 'info', 'general');
        p = {
          ...p,
          storyProgress: {
            ...p.storyProgress,
            activeQuests: [...p.storyProgress.activeQuests, questStub],
            worldEventLog: log,
          },
        };
        const payload = asRecord(consequence.value) as NarrativeDeltaPayload | null;
        if (payload?.factionReputationDelta) {
          p = applyFactionReputationDelta(p, payload.factionReputationDelta as Record<string, unknown>, lang, log);
        }
        if (payload?.locationReputationDelta) {
          p = applyLocationReputationDelta(p, payload.locationReputationDelta as Record<string, unknown>, lang, log);
        }
        pushMarkNpcDead(sideEffects, payload?.markNpcDead);
        break;
      }
      default:
        break;
    }
  }

  return {
    ...p,
    storyProgress: { ...p.storyProgress, worldEventLog: log },
  };
}
