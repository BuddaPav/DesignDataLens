/**
 * Репутация игрока у фракций (−100…100) и дрейф от распространения слухов с тегами фракций.
 */
import type { ActiveRumor, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n/index';
import { t } from '@/i18n/index';

export const FACTION_REPUTATION_MIN = -100;
export const FACTION_REPUTATION_MAX = 100;

/** Базовые фракции стартового мира; ключи совпадают с `storyProgress.factionReputation`. */
export const CHRONOS_CORE_FACTION_IDS = [
  'guild_merchants',
  'church_order',
  'thieves_guild',
  'academy',
] as const;

export type ChronosCoreFactionId = (typeof CHRONOS_CORE_FACTION_IDS)[number];

const CORE_SET = new Set<string>(CHRONOS_CORE_FACTION_IDS);

export function isCoreFactionId(key: string): key is ChronosCoreFactionId {
  return CORE_SET.has(key);
}

export function clampFactionReputation(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(FACTION_REPUTATION_MIN, Math.min(FACTION_REPUTATION_MAX, Math.round(value)));
}

/** Суммирует дельты и ограничивает каждую запись. */
export function mergeFactionReputation(
  prev: Record<string, number> | undefined,
  deltas: Record<string, number>,
): Record<string, number> {
  const base = { ...(prev ?? {}) };
  for (const [k, d] of Object.entries(deltas)) {
    if (!Number.isFinite(d) || d === 0) continue;
    const cur = base[k] ?? 0;
    base[k] = clampFactionReputation(cur + d);
  }
  return base;
}

function severitySpreadWeight(severity: WorldLogEntry['severity'] | undefined): number {
  switch (severity) {
    case 'dramatic':
      return 2.25;
    case 'rumor':
      return 1.1;
    case 'info':
      return 0.55;
    default:
      return 0.9;
  }
}

function countNewlyReachedLocations(before: ActiveRumor, after: ActiveRumor): number {
  const was = new Set(before.reachedLocationIds);
  let n = 0;
  for (const id of after.reachedLocationIds) {
    if (!was.has(id)) n++;
  }
  return n;
}

/**
 * Когда слух с тегами фракций охватывает новые локации, репутация по этим тегам слегка падает
 * (негативный ореол «плохих новостей»). Масштаб мал, чтобы не доминировать над квестами.
 */
export function reputationDeltaFromRumorSpread(
  beforeRumors: ActiveRumor[],
  afterRumors: ActiveRumor[],
): Record<string, number> {
  const beforeById = new Map(beforeRumors.map((r) => [r.id, r]));
  const out: Record<string, number> = {};

  for (const after of afterRumors) {
    const prev = beforeById.get(after.id);
    if (!prev) continue;
    if (after.factionTags.length === 0) continue;

    const spread = countNewlyReachedLocations(prev, after);
    if (spread <= 0) continue;

    const w = severitySpreadWeight(after.severity);
    const perTag = -0.35 * spread * w;

    for (const tag of after.factionTags) {
      out[tag] = (out[tag] ?? 0) + perTag;
    }
  }

  return out;
}

const RUMOR_REP_EPS = 0.45;

function formatFactionRumorRepShift(factionId: string, delta: number, lang: Language): string {
  const name = t(`game.faction.${factionId}` as Parameters<typeof t>[0], lang);
  const rounded = Math.abs(delta) >= 1 ? Math.round(delta) : Math.round(delta * 10) / 10;
  const deltaStr = rounded > 0 ? `+${rounded}` : `${rounded}`;
  return t('game.faction_rep.rumor_shift', lang).replace('{{name}}', name).replace('{{delta}}', deltaStr);
}

/** Строки для журнала мира при заметном дрейфе репутации от слухов (чистая функция). */
export function collectFactionRepShiftLines(
  deltas: Record<string, number>,
  lang: Language,
  minAbs = RUMOR_REP_EPS,
): string[] {
  const out: string[] = [];
  for (const [id, d] of Object.entries(deltas)) {
    if (!Number.isFinite(d) || Math.abs(d) < minAbs) continue;
    out.push(formatFactionRumorRepShift(id, d, lang));
  }
  return out;
}

function formatFactionChoiceRepShift(factionId: string, delta: number, lang: Language): string {
  const name = t(`game.faction.${factionId}` as Parameters<typeof t>[0], lang);
  const rounded = Math.abs(delta) >= 1 ? Math.round(delta) : Math.round(delta * 10) / 10;
  const deltaStr = rounded > 0 ? `+${rounded}` : `${rounded}`;
  return t('game.faction_rep.choice_shift', lang).replace('{{name}}', name).replace('{{delta}}', deltaStr);
}

/** Одна строка журнала при последствии выбора `reputation_change` по ядровой фракции. */
export function formatStoryReputationChoiceLogLine(
  factionId: string,
  delta: number,
  lang: Language,
  minAbs = RUMOR_REP_EPS,
): string | null {
  if (!isCoreFactionId(factionId) || !Number.isFinite(delta) || Math.abs(delta) < minAbs) return null;
  return formatFactionChoiceRepShift(factionId, delta, lang);
}
