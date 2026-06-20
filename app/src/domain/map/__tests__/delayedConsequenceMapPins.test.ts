import { describe, expect, it } from 'vitest';
import type { DelayedConsequencePending } from '@/types/game';
import { buildDelayedConsequenceMapPins } from '@/domain/map/delayedConsequenceMapPins';

describe('buildDelayedConsequenceMapPins', () => {
  it('returns empty without queue', () => {
    expect(buildDelayedConsequenceMapPins(undefined)).toEqual([]);
    expect(buildDelayedConsequenceMapPins([])).toEqual([]);
  });

  it('is deterministic for same id and location', () => {
    const queue: DelayedConsequencePending[] = [
      {
        id: 'dcon_alpha',
        remainingHours: 8,
        source: 'dialogue',
        locationId: 'starting_village',
        consequence: { type: 'reputation_change', key: 'academy', value: 1 },
      },
    ];
    const a = buildDelayedConsequenceMapPins(queue);
    const b = buildDelayedConsequenceMapPins(queue);
    expect(a).toHaveLength(1);
    expect(a[0]?.tileX).toBe(b[0]?.tileX);
    expect(a[0]?.tileY).toBe(b[0]?.tileY);
  });

  it('caps at maxPins', () => {
    const queue: DelayedConsequencePending[] = Array.from({ length: 30 }, (_, i) => ({
      id: `dcon_${i}`,
      remainingHours: i + 1,
      source: 'world' as const,
      locationId: 'starting_village',
      consequence: { type: 'gold', key: 'gold', value: 1 },
    }));
    expect(buildDelayedConsequenceMapPins(queue, 5)).toHaveLength(5);
  });
});
