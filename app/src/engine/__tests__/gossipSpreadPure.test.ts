import { describe, expect, it } from 'vitest';
import { decayAndSpreadRumors } from '@/engine/gossipSpreadPure';

describe('gossipSpreadPure', () => {
  it('expires rumors after ttl', () => {
    const adj = { a: ['b'], b: ['a'] };
    const rumors = [
      {
        id: '1',
        message: 'x',
        ttlHours: 5,
        originLocationId: 'a',
        factionTags: [],
        reachedLocationIds: ['a']
      }
    ];
    const out = decayAndSpreadRumors(rumors, 10, adj);
    expect(out.find((r) => r.id === '1')).toBeUndefined();
  });

  it('spreads reach along edges when rng opens frontier', () => {
    const adj = { a: ['b'], b: ['c'], c: [] };
    const rumors = [
      {
        id: '1',
        message: 'x',
        ttlHours: 100,
        originLocationId: 'a',
        factionTags: [],
        reachedLocationIds: ['a']
      }
    ];
    const next = decayAndSpreadRumors(rumors, 24, adj, () => 0);
    const r = next[0];
    expect(r?.reachedLocationIds.includes('b')).toBe(true);
  });

  it('caps how many new locations can be reached in one spread step', () => {
    const leaves = Array.from({ length: 24 }, (_, i) => `L${i}`);
    const adj: Record<string, string[]> = { hub: leaves };
    for (const L of leaves) adj[L] = ['hub'];
    const rumors = [
      {
        id: 'star',
        message: 'x',
        ttlHours: 100,
        originLocationId: 'hub',
        factionTags: [],
        reachedLocationIds: ['hub'],
      },
    ];
    const next = decayAndSpreadRumors(rumors, 24, adj, () => 0);
    const r = next[0];
    expect(r?.reachedLocationIds.length).toBeLessThanOrEqual(7);
    expect(r?.reachedLocationIds.includes('hub')).toBe(true);
  });

  it('is deterministic with the same supplied RNG sequence', () => {
    const adj = { a: ['b', 'c'], b: ['a'], c: ['a'] };
    const rumors = [
      {
        id: '1',
        message: 'x',
        ttlHours: 100,
        originLocationId: 'a',
        factionTags: [],
        reachedLocationIds: ['a'],
      },
    ];
    const seq = [0.01, 0.9, 0.02, 0.95, 0.03];
    const mkRng = () => {
      let i = 0;
      return () => seq[(i++) % seq.length]!;
    };
    const left = decayAndSpreadRumors(rumors, 24, adj, mkRng());
    const right = decayAndSpreadRumors(rumors, 24, adj, mkRng());
    expect(right).toEqual(left);
  });
});
