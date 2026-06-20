import { describe, expect, it } from 'vitest';

import {
  generateDialogueFollowupQuest,
  isDialogueFollowupQuestId,
  parseDialogueFollowupQuestId,
  parseDialogueFollowupUnlockPayload,
} from '@/domain/consequences/generateDialogueFollowupQuest';

describe('generateDialogueFollowupQuest', () => {
  it('detects dialogue followup quest ids', () => {
    expect(isDialogueFollowupQuestId('dialogue_followup:river_port:abc')).toBe(true);
    expect(isDialogueFollowupQuestId('caravan_supply:river_port:777')).toBe(false);
  });

  it('parses location from quest id', () => {
    expect(parseDialogueFollowupQuestId('dialogue_followup:river_port:abc')).toEqual({
      locationId: 'river_port',
    });
    expect(parseDialogueFollowupQuestId('other:river_port:abc')).toBeNull();
  });

  it('parses unlock payload npcId and tags', () => {
    expect(
      parseDialogueFollowupUnlockPayload({ npcId: 'elara', tags: ['help', 'trade'] }),
    ).toEqual({ npcId: 'elara', tags: ['help', 'trade'] });
    expect(parseDialogueFollowupUnlockPayload(1)).toEqual({});
  });

  it('builds talk objective when npcId is provided', () => {
    const quest = generateDialogueFollowupQuest({
      questId: 'dialogue_followup:starting_village:seed1',
      locationId: 'starting_village',
      npcId: 'elara',
      tags: ['help'],
      lang: 'en',
    });
    expect(quest.objectives[0]?.type).toBe('talk_to_npc');
    expect(quest.objectives[0]?.target).toBe('elara');
    expect(quest.title).toContain('Willbrook');
    expect(quest.title).not.toContain('dialogue_followup:');
    expect(quest.relatedNPCs).toEqual(['elara']);
  });

  it('builds reach objective without npcId', () => {
    const quest = generateDialogueFollowupQuest({
      questId: 'dialogue_followup:river_port:seed2',
      locationId: 'river_port',
      lang: 'ru',
    });
    expect(quest.objectives[0]?.type).toBe('reach_location');
    expect(quest.objectives[0]?.target).toBe('river_port');
    expect(quest.title).toMatch(/разговор|помощ/i);
  });
});
