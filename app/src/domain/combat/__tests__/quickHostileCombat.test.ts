import { describe, expect, it } from 'vitest';
import type { NPC, Player } from '@/types/game';
import {
  canLethallyKillNpcInCombat,
  isNpcHostileForQuickCombat,
  resolveQuickHostileCombat,
} from '@/domain/combat/quickHostileCombat';

const basePr = {
  type: 'enemy' as const,
  trust: -50,
  affection: 0,
  respect: 0,
  fear: 40,
  history: [],
};

function makeNpc(partial: Partial<NPC>): NPC {
  return {
    id: 'proc_x',
    name: 'X',
    title: 't',
    age: 30,
    profession: 'p',
    personality: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
      bravery: 50,
      loyalty: 50,
      greed: 50,
      ambition: 50,
      empathy: 50,
    },
    knowledgeBase: { field: 'f', fieldKeys: [], facts: [], confidence: 0.5 },
    mentalState: { stress: 10, happiness: 50, trauma: 0 },
    status: 'alive',
    location: 'loc',
    level: 1,
    attributes: { strength: 8, intelligence: 8, charisma: 8, agility: 8, wisdom: 8, luck: 8 },
    memories: [],
    relationships: new Map(),
    playerRelationship: basePr,
    schedule: { defaultLocation: 'loc', routines: [], currentActivity: '' },
    goals: [],
    secrets: [],
    backstory: '',
    roleInStory: '',
    avatar: '',
    appearance: '',
    ...partial,
  } as NPC;
}

const basePlayer: Pick<Player, 'stats' | 'character'> = {
  character: {
    name: 'P',
    title: 't',
    level: 1,
    experience: 0,
    attributes: { strength: 14, intelligence: 10, charisma: 10, agility: 10, wisdom: 10, luck: 10 },
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
    worldEra: 'medieval',
    personality: { brave: 50, cunning: 50, kind: 50, ruthless: 50, honorable: 50, mysterious: 50 },
  },
  stats: {
    health: 100,
    maxHealth: 100,
    mana: 0,
    maxMana: 0,
    stamina: 100,
    maxStamina: 100,
    reputation: new Map(),
    achievements: [],
    battlesWon: 0,
    battlesLost: 0,
    enemiesDefeated: 0,
  },
};

describe('quickHostileCombat', () => {
  it('detects hostile from enemy relationship', () => {
    const n = makeNpc({ playerRelationship: basePr });
    expect(isNpcHostileForQuickCombat(n)).toBe(true);
  });

  it('not hostile when trust high', () => {
    const n = makeNpc({
      playerRelationship: {
        ...basePr,
        type: 'friend',
        trust: 40,
        fear: 0,
      },
    });
    expect(isNpcHostileForQuickCombat(n)).toBe(false);
  });

  it('proc npc can be lethally killed in combat', () => {
    expect(canLethallyKillNpcInCombat(makeNpc({ id: 'proc_bandit_1' }))).toBe(true);
  });

  it('story npc cannot be lethally killed', () => {
    expect(canLethallyKillNpcInCombat(makeNpc({ id: 'elara' }))).toBe(false);
  });

  it('strong player wins at roll 0 vs weak npc', () => {
    const npc = makeNpc({
      id: 'proc_a',
      attributes: { strength: 4, intelligence: 5, charisma: 5, agility: 5, wisdom: 5, luck: 5 },
      level: 1,
    });
    expect(resolveQuickHostileCombat({ player: basePlayer, npc, roll: 0 })).toBe('player_wins');
  });

  it('weak player loses at roll near 1 vs strong npc', () => {
    const weak: typeof basePlayer = {
      ...basePlayer,
      character: {
        ...basePlayer.character,
        attributes: { strength: 4, intelligence: 10, charisma: 10, agility: 10, wisdom: 10, luck: 10 },
      },
      stats: { ...basePlayer.stats, health: 20, maxHealth: 100 },
    };
    const npc = makeNpc({
      id: 'proc_b',
      attributes: { strength: 18, intelligence: 8, charisma: 8, agility: 8, wisdom: 8, luck: 8 },
      level: 5,
    });
    expect(resolveQuickHostileCombat({ player: weak, npc, roll: 0.99 })).toBe('player_loses');
  });
});
