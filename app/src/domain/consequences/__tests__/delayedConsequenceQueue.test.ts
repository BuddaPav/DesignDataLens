import { describe, expect, it } from 'vitest';
import { applyChoiceConsequencesBatch } from '@/domain/consequences/applyChoiceConsequences';
import { deriveDialogueConsequences } from '@/domain/consequences/deriveDialogueConsequences';
import {
  delayedConsequenceStats,
  enqueueDelayedConsequences,
  MAX_DELAYED_CONSEQUENCES,
  MIN_DELAY_HOURS,
  tickDelayedConsequencesQueue,
} from '@/domain/consequences/delayedConsequenceQueue';
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

function basePlayer(): Player {
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
  };
}

describe('delayedConsequenceQueue', () => {
  it('enqueues only delayed consequences', () => {
    const list: Consequence[] = [
      { type: 'reputation_change', key: 'academy', value: 2, delay: 12 },
      { type: 'gold', key: 'gold', value: 5 },
    ];
    const queue = enqueueDelayedConsequences([], list, 'dialogue', 'starting_village');
    expect(queue).toHaveLength(1);
    expect(queue[0]?.remainingHours).toBe(12);
    expect(queue[0]?.consequence.type).toBe('reputation_change');
  });

  it('releases items when enough hours pass', () => {
    const list: Consequence[] = [{ type: 'reputation_change', key: 'academy', value: 2, delay: 3 }];
    const queue = enqueueDelayedConsequences([], list, 'dialogue', 'starting_village');
    const tick = tickDelayedConsequencesQueue(queue, 3);
    expect(tick.queue).toHaveLength(0);
    expect(tick.released).toHaveLength(1);
    expect(tick.released[0]?.consequence.type).toBe('reputation_change');
  });

  it('partial tick reduces remaining hours without releasing', () => {
    const list: Consequence[] = [{ type: 'reputation_change', key: 'academy', value: 2, delay: 10 }];
    const queue = enqueueDelayedConsequences([], list, 'dialogue', 'starting_village');
    const tick = tickDelayedConsequencesQueue(queue, 3);
    expect(tick.released).toHaveLength(0);
    expect(tick.queue).toHaveLength(1);
    expect(tick.queue[0]?.remainingHours).toBe(7);
  });

  it('enforces minimum delay hours', () => {
    const list: Consequence[] = [{ type: 'reputation_change', key: 'academy', value: 2, delay: 0 }];
    const queue = enqueueDelayedConsequences([], list, 'dialogue', 'starting_village');
    expect(queue).toHaveLength(1);
    expect(queue[0]?.remainingHours).toBe(MIN_DELAY_HOURS);
  });

  it('assigns unique ids across repeated enqueues of the same signature', () => {
    const item: Consequence = { type: 'reputation_change', key: 'academy', value: 2, delay: 5 };
    let queue = enqueueDelayedConsequences([], [item], 'dialogue', 'starting_village');
    queue = enqueueDelayedConsequences(queue, [item], 'dialogue', 'starting_village');
    const ids = queue.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('caps queue length', () => {
    const list: Consequence[] = Array.from({ length: MAX_DELAYED_CONSEQUENCES + 5 }, (_, i) => ({
      type: 'reputation_change' as const,
      key: `faction_slot_${i}`,
      value: 1,
      delay: i + 1,
    }));
    const queue = enqueueDelayedConsequences([], list, 'world', 'starting_village');
    expect(queue).toHaveLength(MAX_DELAYED_CONSEQUENCES);
    expect(queue[0]?.remainingHours).toBeLessThanOrEqual(queue[queue.length - 1]?.remainingHours ?? 0);
  });

  it('compacts duplicated signatures', () => {
    const list: Consequence[] = [
      { type: 'reputation_change', key: 'academy', value: 2, delay: 3 },
      { type: 'reputation_change', key: 'academy', value: 2, delay: 9 },
      { type: 'reputation_change', key: 'academy', value: 2, delay: 12 },
    ];
    const queue = enqueueDelayedConsequences([], list, 'dialogue', 'starting_village');
    expect(queue).toHaveLength(2);
    expect(queue[0]?.remainingHours).toBeLessThanOrEqual(queue[1]?.remainingHours ?? 0);
  });

  it('returns stats window for UI', () => {
    const list: Consequence[] = [
      { type: 'reputation_change', key: 'academy', value: 2, delay: 4 },
      { type: 'reputation_change', key: 'church_order', value: -1, delay: 10 },
    ];
    const queue = enqueueDelayedConsequences([], list, 'world', 'starting_village');
    const stats = delayedConsequenceStats(queue);
    expect(stats.count).toBe(2);
    expect(stats.minHours).toBe(4);
    expect(stats.maxHours).toBe(10);
  });
});

describe('delayedConsequenceQueue integration', () => {
  it('deriveDialogueConsequences delay -> enqueue -> tick -> reputation', () => {
    const consequences = deriveDialogueConsequences({
      line: 'Please help me with the caravan trade route.',
      npcId: 'npc_1',
      locationId: 'river_port',
      lang: 'en',
    });
    const delayedRep = consequences.find(
      (c) => c.type === 'reputation_change' && c.key === 'guild_merchants' && c.delay,
    );
    expect(delayedRep).toBeTruthy();

    const queue = enqueueDelayedConsequences([], consequences, 'dialogue', 'river_port');
    const pending = queue.find((p) => p.consequence.key === 'guild_merchants');
    expect(pending).toBeTruthy();

    const hours = pending!.remainingHours;
    const partial = tickDelayedConsequencesQueue(queue, hours - 1);
    expect(partial.released).toHaveLength(0);

    const mature = tickDelayedConsequencesQueue(partial.queue, 1);
    expect(mature.released.some((p) => p.consequence.key === 'guild_merchants')).toBe(true);

    const player = basePlayer();
    const before = player.storyProgress.factionReputation?.guild_merchants ?? 0;
    const log: WorldLogEntry[] = [];
    const flags: { key: string; value: unknown }[] = [];
    const next = applyChoiceConsequencesBatch(
      player,
      mature.released.map((p) => p.consequence),
      'en',
      log,
      flags,
      { npcRelDeltas: [], npcIdsToMarkDead: [] },
    );
    expect(next.storyProgress.factionReputation?.guild_merchants).toBe(before + Number(delayedRep!.value));
  });
});
