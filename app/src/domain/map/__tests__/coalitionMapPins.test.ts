import { describe, expect, it } from 'vitest';
import type { EnemyCoalition, NPC } from '@/types/game';
import { buildCoalitionMapPins } from '@/domain/map/coalitionMapPins';

describe('buildCoalitionMapPins', () => {
  it('uses leader world tile when NPC present', () => {
    const coalitions: EnemyCoalition[] = [
      {
        id: 'coal_1',
        formedAt: 1000,
        leaderNpcId: 'vesper',
        memberNpcIds: ['a', 'b'],
        anchorLocationId: 'starting_village',
      },
    ];
    const npcs = [
      { id: 'vesper', worldTile: { x: 42, y: 43 }, location: 'starting_village' },
    ] as unknown as NPC[];

    const pins = buildCoalitionMapPins(coalitions, npcs);
    expect(pins).toHaveLength(1);
    expect(pins[0].tileX).toBe(42);
    expect(pins[0].tileY).toBe(43);
    expect(pins[0].memberCount).toBe(2);
  });

  it('returns empty without coalitions', () => {
    expect(buildCoalitionMapPins(undefined, [])).toEqual([]);
  });
});
