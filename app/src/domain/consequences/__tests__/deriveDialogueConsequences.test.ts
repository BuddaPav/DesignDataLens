import { describe, expect, it } from 'vitest';
import { deriveDialogueConsequences } from '@/domain/consequences/deriveDialogueConsequences';

describe('deriveDialogueConsequences', () => {
  it('returns trust/help consequences for cooperative intent', () => {
    const cons = deriveDialogueConsequences({
      line: 'Please help me with the caravan trade route.',
      npcId: 'npc_1',
      locationId: 'river_port',
      lang: 'en',
    });
    expect(cons.some((c) => c.type === 'npc_relationship')).toBe(true);
    const unlock = cons.find((c) => c.type === 'quest_unlock');
    expect(unlock).toBeTruthy();
    expect(unlock?.key.startsWith('dialogue_followup:river_port:')).toBe(true);
    expect(unlock?.value).toEqual(
      expect.objectContaining({ npcId: 'npc_1', tags: expect.arrayContaining(['help', 'trade']) }),
    );
    expect(cons.some((c) => c.type === 'reputation_change' && c.key === 'guild_merchants')).toBe(true);
  });

  it('creates fear and social tension for explicit threats', () => {
    const cons = deriveDialogueConsequences({
      line: 'Я тебя убью, если не дашь мне то, что хочу.',
      npcId: 'npc_2',
      locationId: 'starting_village',
      lang: 'ru',
    });
    const rel = cons.find((c) => c.type === 'npc_relationship');
    expect(rel).toBeTruthy();
    expect(cons.some((c) => c.type === 'world_event')).toBe(true);
    expect(cons.some((c) => c.type === 'reputation_change' && c.delay && c.delay > 0)).toBe(true);
  });

  it('ignores too-short messages', () => {
    const cons = deriveDialogueConsequences({
      line: 'ok',
      npcId: 'npc_3',
      locationId: 'starting_village',
      lang: 'en',
    });
    expect(cons).toEqual([]);
  });
});
