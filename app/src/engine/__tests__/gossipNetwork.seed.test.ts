import { describe, expect, it } from 'vitest';

import { tickActiveRumorsSync } from '@/engine/gossipNetwork';
import { createDeterministicRng } from '@/domain/sim/deterministicRng';
import type { ActiveRumor } from '@/types/game';

describe('gossipNetwork deterministic seed', () => {
  it('returns identical spread with the same deterministic RNG seed', () => {
    const rumors: ActiveRumor[] = [
      {
        id: 'r1',
        message: 'x',
        severity: 'rumor',
        ttlHours: 100,
        originLocationId: 'a',
        factionTags: [],
        reachedLocationIds: ['a'],
      },
    ];
    const adjacency = {
      a: ['b', 'c'],
      b: ['a', 'd'],
      c: ['a'],
      d: ['b'],
    };
    const left = tickActiveRumorsSync(
      rumors.map((r) => ({ ...r, reachedLocationIds: [...r.reachedLocationIds] })),
      24,
      adjacency,
      createDeterministicRng(77),
    );
    const right = tickActiveRumorsSync(
      rumors.map((r) => ({ ...r, reachedLocationIds: [...r.reachedLocationIds] })),
      24,
      adjacency,
      createDeterministicRng(77),
    );
    expect(right).toEqual(left);
  });
});

