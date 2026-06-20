import { describe, expect, it } from 'vitest';

import { resetAIStoryEngine } from '@/engine/AIStoryEngine';
import { ITEM_TEMPLATE_CATALOG } from '@/domain/inventory/itemCatalog';
import { STORY_LOCATIONS } from '@/domain/world/storyLocations';
import type { AIStoryContext, Player } from '@/types/game';

function minimalPlayer(): Player {
  return {
    id: 'p1',
    name: 'Tester',
    createdAt: 1,
    character: {
      name: 'Tester',
      title: 'The Chosen',
      level: 1,
      experience: 0,
      attributes: { strength: 10, intelligence: 10, charisma: 10, agility: 10, wisdom: 10, luck: 10 },
      appearance: { avatar: '', skinTone: 'medium', hairStyle: 'short', hairColor: 'brown', eyeColor: 'blue', outfit: 'traveler', accessories: [] },
      origin: 'unknown',
      backstory: '',
      worldEra: 'medieval',
      personality: { brave: 50, cunning: 50, kind: 50, ruthless: 50, honorable: 50, mysterious: 50 },
    },
    stats: {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 100,
      maxStamina: 100,
      reputation: new Map(),
      achievements: [],
      battlesWon: 0,
      battlesLost: 0,
      enemiesDefeated: 0,
    },
    inventory: { gold: 100, items: [], maxSlots: 20, storyTokens: 0 },
    storyProgress: {
      currentChapter: 1,
      currentScene: 'intro',
      mainQuest: null,
      activeQuests: [],
      completedQuests: [],
      worldState: {
        time: { year: 1247, month: 1, day: 1, hour: 8, minute: 0 },
        weather: 'clear',
        globalEvents: [],
        factionPowers: new Map(),
      },
      discoveredLocations: ['starting_village'],
      metNPCs: [],
      unlockedLore: [],
      worldEventLog: [],
      worldPosition: { tileX: 500_000, tileY: 500_000 },
      enemyCoalitions: [],
      activeRumors: [],
      factionReputation: { guild_merchants: 0, church_order: 0, thieves_guild: 0, academy: 0 },
      tradeCaravans: [],
      rumorConsequenceQueue: [],
    },
    choices: [],
    archetype: 'storyteller',
    preferredTone: 'mysterious',
    emotionalHistory: [],
    lastSession: 1,
    totalPlayTime: 0,
    sessionCount: 1,
  };
}

function contextFactory(): AIStoryContext {
  return {
    player: minimalPlayer(),
    currentQuest: null,
    currentLocation: STORY_LOCATIONS[0]!,
    recentEvents: [],
    relevantMemories: [],
    emotionalState: 'neutral',
    sessionMetrics: {
      startTime: 1,
      actionsCount: 0,
      choicesMade: 0,
      combatEncounters: 0,
      dialogueExchanges: 0,
      explorationScore: 0,
      avgDecisionTime: 0,
    },
    eligibleDefeatNpcIds: [],
  };
}

describe('AIStoryEngine content packs', () => {
  it('collect_item objectives use known template keys', () => {
    const engine = resetAIStoryEngine(1234);
    const ctx = contextFactory();
    const known = new Set(Object.keys(ITEM_TEMPLATE_CATALOG));
    for (let i = 0; i < 30; i++) {
      const quest = engine.generateQuest(ctx, 'side');
      for (const obj of quest.objectives) {
        if (obj.type === 'collect_item') {
          expect(known.has(obj.target)).toBe(true);
        }
      }
    }
  });

  it('quest unlock consequences use roadmap prefixes', () => {
    const engine = resetAIStoryEngine(2026);
    const ctx = contextFactory();
    const prefixes = ['caravan_supply:', 'marsh_route:', 'ridge_conflict:'];
    let checked = false;
    for (let i = 0; i < 120; i++) {
      const scene = engine.generateScene(ctx);
      for (const ch of scene.choices) {
        for (const c of ch.consequences) {
          if (c.type === 'quest_unlock') {
            checked = true;
            expect(prefixes.some((p) => c.key.startsWith(p))).toBe(true);
          }
        }
      }
    }
    expect(checked).toBe(true);
  });

  it('generated objectives use real world-linked targets', () => {
    const engine = resetAIStoryEngine(9090);
    const ctx = contextFactory();
    const knownLocations = new Set(STORY_LOCATIONS.map((l) => l.id));
    const knownNpcIds = new Set(ctx.currentLocation.npcs);
    for (let i = 0; i < 40; i++) {
      const quest = engine.generateQuest(ctx, 'main');
      for (const obj of quest.objectives) {
        if (obj.type === 'reach_location') {
          expect(knownLocations.has(obj.target)).toBe(true);
        }
        if (obj.type === 'talk_to_npc' && knownNpcIds.size > 0) {
          expect(knownNpcIds.has(obj.target)).toBe(true);
        }
        if (obj.type === 'solve_puzzle') {
          expect(obj.target.includes(':puzzle_')).toBe(true);
        }
      }
    }
  });
});
