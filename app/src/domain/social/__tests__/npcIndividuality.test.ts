import { describe, expect, it } from 'vitest';
import { effectiveGossipImpact, shouldNpcSpreadGossip } from '@/domain/social/npcIndividuality';
import type { NPCPersonality, Relationship } from '@/types/game';

const basePersonality = (): NPCPersonality => ({
  openness: 0.5,
  conscientiousness: 0.5,
  extraversion: 0.7,
  agreeableness: 0.5,
  neuroticism: 0.4,
  bravery: 50,
  loyalty: 50,
  greed: 40,
  ambition: 50,
  empathy: 50,
});

const rel = (over: Partial<Relationship>): Relationship => ({
  type: 'acquaintance',
  trust: 0,
  affection: 0,
  respect: 0,
  fear: 0,
  history: [],
  ...over,
});

describe('effectiveGossipImpact', () => {
  it('inverts or dampens positive contact when NPC is hostile', () => {
    const enemy = rel({ type: 'enemy', trust: -85 });
    expect(effectiveGossipImpact(enemy, 5)).toBeLessThan(0);
    const rival = rel({ type: 'rival', trust: -35 });
    expect(effectiveGossipImpact(rival, 4)).toBeLessThan(0);
  });

  it('amplifies goodwill from friends and lovers', () => {
    const friend = rel({ type: 'friend', trust: 40, affection: 20 });
    expect(effectiveGossipImpact(friend, 3)).toBeGreaterThan(3);
    const lover = rel({ type: 'lover', trust: 85, affection: 80 });
    expect(effectiveGossipImpact(lover, 2)).toBeGreaterThan(2);
  });

  it('softens negative gossip from close bonds', () => {
    const lover = rel({ type: 'lover', trust: 82, affection: 78 });
    expect(effectiveGossipImpact(lover, -4)).toBeGreaterThan(-4);
  });
});

describe('shouldNpcSpreadGossip', () => {
  it('requires location and sufficient effective impact', () => {
    const p = basePersonality();
    expect(
      shouldNpcSpreadGossip({
        locationId: undefined,
        personality: p,
        relationship: rel({ trust: 0 }),
        effectiveImpact: 2,
      })
    ).toBe(false);
    expect(
      shouldNpcSpreadGossip({
        locationId: 'a',
        personality: p,
        relationship: rel({ trust: 0 }),
        effectiveImpact: 0.1,
      })
    ).toBe(false);
  });

  it('allows venting for neurotic low-trust NPCs', () => {
    const p: NPCPersonality = { ...basePersonality(), extraversion: 0.3, neuroticism: 0.62 };
    expect(
      shouldNpcSpreadGossip({
        locationId: 'village',
        personality: p,
        relationship: rel({ trust: -40 }),
        effectiveImpact: -1,
      })
    ).toBe(true);
  });
});
