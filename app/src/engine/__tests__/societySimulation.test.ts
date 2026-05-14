import { describe, expect, it } from 'vitest';
import type { NPC } from '@/types/game';
import { ensureCrowdPair } from '@/engine/societySimulation';

function minimalNpc(id: string, location: string): NPC {
  return {
    id,
    name: id,
    title: 't',
    age: 30,
    profession: 'p',
    avatar: '',
    appearance: '',
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
      empathy: 50
    },
    knowledgeBase: {
      field: 'general',
      fieldKeys: [],
      facts: [],
      confidence: 0.5
    },
    mentalState: {
      stress: 10,
      happiness: 50,
      trauma: 0
    },
    status: 'alive',
    location,
    level: 1,
    attributes: {
      strength: 10,
      intelligence: 10,
      charisma: 10,
      agility: 10,
      wisdom: 10,
      luck: 10
    },
    memories: [],
    relationships: new Map(),
    playerRelationship: {
      type: 'stranger',
      trust: 0,
      affection: 0,
      respect: 0,
      fear: 0,
      history: []
    },
    schedule: { defaultLocation: location, routines: [], currentActivity: 'idle' },
    goals: [],
    secrets: [],
    backstory: '',
    roleInStory: ''
  };
}

describe('societySimulation', () => {
  it('ensureCrowdPair creates bidirectional neutral edges', () => {
    const a = minimalNpc('a', 'loc1');
    const b = minimalNpc('b', 'loc1');
    ensureCrowdPair(a, b);
    expect(a.relationships.has('b')).toBe(true);
    expect(b.relationships.has('a')).toBe(true);
    expect(a.relationships.get('b')?.trust).toBe(0);
  });
});
