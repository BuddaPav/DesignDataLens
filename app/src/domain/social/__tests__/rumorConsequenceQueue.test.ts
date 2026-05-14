import { describe, expect, it } from 'vitest';
import {
  CHRONOS_RUMOR_REP_RIPPLE_FRACTION,
  splitRumorReputationRipple,
  tickRumorConsequenceQueue,
} from '@/domain/social/rumorConsequenceQueue';

describe('rumorConsequenceQueue', () => {
  it('tickRumorConsequenceQueue releases when hours exceed remaining', () => {
    const q = [
      {
        id: 'a',
        remainingHours: 5,
        factionRepDelta: { guild_merchants: -2 },
      },
    ];
    const out = tickRumorConsequenceQueue(q, 6);
    expect(out.queue).toHaveLength(0);
    expect(out.releasedReputationDelta.guild_merchants).toBe(-2);
  });

  it('tickRumorConsequenceQueue subtracts hours without releasing', () => {
    const q = [
      {
        id: 'a',
        remainingHours: 10,
        factionRepDelta: { academy: -1 },
      },
    ];
    const out = tickRumorConsequenceQueue(q, 4);
    expect(out.queue).toHaveLength(1);
    expect(out.queue[0]?.remainingHours).toBe(6);
    expect(Object.keys(out.releasedReputationDelta)).toHaveLength(0);
  });

  it('splitRumorReputationRipple separates immediate and pending for large deltas', () => {
    const raw = { thieves_guild: -10 };
    const { immediate, pending } = splitRumorReputationRipple(raw);
    expect(immediate.thieves_guild).toBeCloseTo(-10 * (1 - CHRONOS_RUMOR_REP_RIPPLE_FRACTION), 5);
    expect(pending.length).toBe(1);
    expect(pending[0]?.factionRepDelta.thieves_guild).toBeCloseTo(-10 * CHRONOS_RUMOR_REP_RIPPLE_FRACTION, 5);
  });

  it('splitRumorReputationRipple passes tiny deltas through immediate only', () => {
    const { immediate, pending } = splitRumorReputationRipple({ academy: -0.5 });
    expect(immediate.academy).toBe(-0.5);
    expect(pending).toHaveLength(0);
  });
});
