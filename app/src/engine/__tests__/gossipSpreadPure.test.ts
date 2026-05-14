import { describe, expect, it, vi } from 'vitest';
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
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0);
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
    const next = decayAndSpreadRumors(rumors, 24, adj);
    rnd.mockRestore();
    const r = next[0];
    expect(r?.reachedLocationIds.includes('b')).toBe(true);
  });

  it('caps how many new locations can be reached in one spread step', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0);
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
    const next = decayAndSpreadRumors(rumors, 24, adj);
    rnd.mockRestore();
    const r = next[0];
    expect(r?.reachedLocationIds.length).toBeLessThanOrEqual(7);
    expect(r?.reachedLocationIds.includes('hub')).toBe(true);
  });
});
