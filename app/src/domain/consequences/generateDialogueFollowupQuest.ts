import type { Language } from '@/i18n';
import { t } from '@/i18n';
import type { Quest } from '@/types/game';
import { getStoryLocationById } from '@/domain/world/storyLocations';

export type DialogueFollowupTag = 'help' | 'trade' | 'faith' | 'science';

export type DialogueFollowupUnlockPayload = {
  npcId?: string;
  tags?: DialogueFollowupTag[];
};

type DialogueFollowupInput = {
  questId: string;
  locationId: string;
  npcId?: string;
  tags?: DialogueFollowupTag[];
  lang: Language;
};

const TITLE_KEYS: Record<DialogueFollowupTag | 'default', Parameters<typeof t>[0]> = {
  help: 'game.quest.dialogue_followup.title.help',
  trade: 'game.quest.dialogue_followup.title.trade',
  faith: 'game.quest.dialogue_followup.title.faith',
  science: 'game.quest.dialogue_followup.title.science',
  default: 'game.quest.dialogue_followup.title.default',
};

export function isDialogueFollowupQuestId(questId: string): boolean {
  return questId.startsWith('dialogue_followup:');
}

export function parseDialogueFollowupQuestId(questId: string): { locationId: string } | null {
  if (!isDialogueFollowupQuestId(questId)) return null;
  const parts = questId.split(':');
  if (parts.length < 3) return null;
  return { locationId: parts[1] ?? 'starting_village' };
}

export function parseDialogueFollowupUnlockPayload(
  value: unknown,
): DialogueFollowupUnlockPayload {
  if (!value || typeof value !== 'object') return {};
  const rec = value as Record<string, unknown>;
  const npcId = typeof rec.npcId === 'string' ? rec.npcId.trim() : undefined;
  const tags = Array.isArray(rec.tags)
    ? rec.tags.filter((tag): tag is DialogueFollowupTag =>
        tag === 'help' || tag === 'trade' || tag === 'faith' || tag === 'science',
      )
    : undefined;
  return { npcId: npcId || undefined, tags: tags?.length ? tags : undefined };
}

export function generateDialogueFollowupQuest({
  questId,
  locationId,
  npcId,
  tags,
  lang,
}: DialogueFollowupInput): Quest {
  const locName = getStoryLocationById(locationId)?.name ?? locationId;
  const primaryTag = tags?.[0];
  const titleKey = primaryTag ? TITLE_KEYS[primaryTag] : TITLE_KEYS.default;
  const title = t(titleKey, lang).replace('{{location}}', locName);
  const description = t('game.quest.dialogue_followup.desc', lang);

  const objectives = npcId
    ? [
        {
          id: `obj_${questId}_talk`,
          description: t('game.quest.dialogue_followup.obj.talk', lang),
          type: 'talk_to_npc' as const,
          target: npcId,
          required: 1,
          current: 0,
          completed: false,
        },
      ]
    : [
        {
          id: `obj_${questId}_reach`,
          description: t('game.quest.dialogue_followup.obj.reach', lang).replace(
            '{{location}}',
            locName,
          ),
          type: 'reach_location' as const,
          target: locationId,
          required: 1,
          current: 0,
          completed: false,
        },
      ];

  return {
    id: questId,
    type: 'generated',
    title,
    description,
    objectives,
    currentObjectiveIndex: 0,
    scenes: [],
    currentSceneIndex: 0,
    status: 'active',
    rewards: [],
    relatedNPCs: npcId ? [npcId] : [],
    generated: true,
  };
}
