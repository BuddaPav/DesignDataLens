import { describe, expect, it } from 'vitest';

import {
  applyChoiceConsequencesBatch,
  type ChoiceBatchSideEffects,
} from '@/domain/consequences/applyChoiceConsequences';
import { deriveDialogueConsequences } from '@/domain/consequences/deriveDialogueConsequences';
import type { Consequence, Player, Quest, WorldLogEntry } from '@/types/game';

function dummyQuest(id: string): Quest {
  return {
    id,
    type: 'side',
    title: 'T',
    description: '',
    objectives: [],
    currentObjectiveIndex: 0,
    scenes: [],
    currentSceneIndex: 0,
    status: 'active',
    rewards: [],
    relatedNPCs: [],
    generated: false,
  };
}

function basePlayer(over: Partial<Player> = {}): Player {
  const sp = {
    currentChapter: 1,
    currentScene: 's',
    mainQuest: null,
    activeQuests: [dummyQuest('q1')],
    completedQuests: [] as string[],
    worldState: {
      time: { year: 1, month: 1, day: 1, hour: 8, minute: 0 },
      weather: 'clear' as const,
      globalEvents: [],
      factionPowers: new Map<string, number>(),
    },
    discoveredLocations: [],
    metNPCs: [],
    unlockedLore: [],
    worldEventLog: [] as WorldLogEntry[],
    worldPosition: { tileX: 0, tileY: 0 },
    factionReputation: { guild_merchants: 0, church_order: 0, thieves_guild: 0, academy: 0 },
  };
  return {
    id: 'p',
    name: 'Hero',
    createdAt: 0,
    character: {
      name: 'Hero',
      title: 'x',
      level: 1,
      experience: 0,
      attributes: {
        strength: 10,
        intelligence: 10,
        charisma: 10,
        agility: 10,
        wisdom: 10,
        luck: 10,
      },
      appearance: {
        avatar: '',
        skinTone: 'm',
        hairStyle: 's',
        hairColor: 'b',
        eyeColor: 'b',
        outfit: 'o',
        accessories: [],
      },
      origin: 'o',
      backstory: '',
      personality: {
        brave: 50,
        cunning: 50,
        kind: 50,
        ruthless: 50,
        honorable: 50,
        mysterious: 50,
      },
    },
    stats: {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 50,
      maxStamina: 50,
      reputation: new Map(),
      achievements: [],
      battlesWon: 0,
      battlesLost: 0,
      enemiesDefeated: 0,
    },
    inventory: { gold: 100, items: [], maxSlots: 20 },
    storyProgress: sp,
    choices: [],
    archetype: 'storyteller',
    preferredTone: 'mysterious',
    emotionalHistory: [],
    lastSession: 0,
    totalPlayTime: 0,
    sessionCount: 1,
    ...over,
  };
}

describe('applyChoiceConsequencesBatch', () => {
  it('composes attribute and reputation in one batch', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const cons: Consequence[] = [
      { type: 'attribute_change', key: 'strength', value: 2 },
      { type: 'reputation_change', key: 'academy', value: 5 },
    ];
    const next = applyChoiceConsequencesBatch(prev, cons, 'en', log, flags);
    expect(next.character.attributes.strength).toBe(12);
    expect(next.storyProgress.factionReputation?.academy).toBe(5);
    expect(flags).toHaveLength(0);
  });

  it('logs large gold changes', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      prev,
      [{ type: 'gold', key: 'gold', value: 100 }],
      'en',
      log,
      flags,
    );
    expect(next.inventory.gold).toBe(200);
    expect(log.some((e) => e.message.includes('100'))).toBe(true);
  });

  it('completes quest and removes from active', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      prev,
      [{ type: 'quest_complete', key: 'q1', value: 1 }],
      'en',
      log,
      flags,
    );
    expect(next.storyProgress.completedQuests).toContain('q1');
    expect(next.storyProgress.activeQuests).toHaveLength(0);
  });

  it('collects story_flag ops', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    applyChoiceConsequencesBatch(
      prev,
      [{ type: 'story_flag', key: 'met_dragon', value: true }],
      'en',
      log,
      flags,
    );
    expect(flags).toEqual([{ key: 'met_dragon', value: true }]);
  });

  it('unlocks dialogue followup quest with talk objective from derived consequences', () => {
    const prev = basePlayer({ storyProgress: { ...basePlayer().storyProgress, activeQuests: [] } });
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const cons = deriveDialogueConsequences({
      line: 'Please help me with the caravan trade route.',
      npcId: 'elara',
      locationId: 'starting_village',
      lang: 'en',
    });
    const next = applyChoiceConsequencesBatch(prev, cons, 'en', log, flags);
    const unlock = cons.find((c) => c.type === 'quest_unlock');
    const quest = next.storyProgress.activeQuests.find((q) => q.id === unlock?.key);
    expect(quest).toBeTruthy();
    expect(quest?.objectives[0]?.type).toBe('talk_to_npc');
    expect(quest?.objectives[0]?.target).toBe('elara');
    expect(quest?.title).not.toContain('dialogue_followup:');
    expect(log.some((e) => e.message.includes(quest!.title))).toBe(true);
  });

  it('does not duplicate dialogue followup quest on repeat unlock', () => {
    const prev = basePlayer({ storyProgress: { ...basePlayer().storyProgress, activeQuests: [] } });
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const cons: Consequence[] = [
      {
        type: 'quest_unlock',
        key: 'dialogue_followup:starting_village:dup',
        value: { npcId: 'elara', tags: ['help'] },
      },
    ];
    const once = applyChoiceConsequencesBatch(prev, cons, 'en', log, flags);
    const twice = applyChoiceConsequencesBatch(once, cons, 'en', log, flags);
    expect(
      twice.storyProgress.activeQuests.filter((q) => q.id === 'dialogue_followup:starting_village:dup'),
    ).toHaveLength(1);
  });

  it('unlocks quest into activeQuests', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      prev,
      [{ type: 'quest_unlock', key: 'caravan_supply:river_port:777', value: 1 }],
      'en',
      log,
      flags,
    );
    const unlocked = next.storyProgress.activeQuests.find((q) => q.id === 'caravan_supply:river_port:777');
    expect(unlocked).toBeTruthy();
    expect(unlocked?.objectives[0]?.target).toBe('river_port');
    expect(log.some((e) => e.message.toLowerCase().includes('quest'))).toBe(true);
  });

  it('applies faction reputation delta from quest_complete payload', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      prev,
      [
        {
          type: 'quest_complete',
          key: 'q1',
          value: { factionReputationDelta: { academy: 3, thieves_guild: -2 } },
        },
      ],
      'en',
      log,
      flags,
    );
    const fr = next.storyProgress.factionReputation;
    expect(fr).toBeDefined();
    expect(fr!.academy).toBe(3);
    expect(fr!.thieves_guild).toBe(-2);
    expect(log.some((e) => e.message.toLowerCase().includes('academy'))).toBe(true);
  });

  it('applies location reputation from world_event payload', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      prev,
      [
        {
          type: 'world_event',
          key: 'echo',
          value: {
            message: 'Whispers spread.',
            locationReputationDelta: { starting_village: -4 },
          },
        },
      ],
      'en',
      log,
      flags,
    );
    expect(next.stats.reputation.get('location:starting_village')).toBe(-4);
    expect(log.some((e) => e.message.includes('starting_village'))).toBe(true);
  });

  it('collects npc_relationship deltas without treating npc id as quest', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const side: ChoiceBatchSideEffects = { npcRelDeltas: [], npcIdsToMarkDead: [] };
    applyChoiceConsequencesBatch(
      prev,
      [{ type: 'npc_relationship', key: 'thorin', value: { trust: 4, affection: 1 } }],
      'en',
      log,
      flags,
      side,
    );
    expect(flags).toHaveLength(0);
    expect(side.npcRelDeltas).toEqual([{ npcId: 'thorin', trust: 4, affection: 1 }]);
    expect(prev.storyProgress.activeQuests).toHaveLength(1);
  });

  it('collects npc_mark_dead from consequence key', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const side: ChoiceBatchSideEffects = { npcRelDeltas: [], npcIdsToMarkDead: [] };
    applyChoiceConsequencesBatch(
      prev,
      [{ type: 'npc_mark_dead', key: 'bandit_1', value: true }],
      'en',
      log,
      flags,
      side,
    );
    expect(side.npcIdsToMarkDead).toEqual(['bandit_1']);
  });

  it('collects markNpcDead from world_event payload', () => {
    const prev = basePlayer();
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const side: ChoiceBatchSideEffects = { npcRelDeltas: [], npcIdsToMarkDead: [] };
    applyChoiceConsequencesBatch(
      prev,
      [
        {
          type: 'world_event',
          key: 'fall',
          value: { message: 'Fallen.', markNpcDead: 'bandit_2' },
        },
      ],
      'en',
      log,
      flags,
      side,
    );
    expect(side.npcIdsToMarkDead).toContain('bandit_2');
  });
});
