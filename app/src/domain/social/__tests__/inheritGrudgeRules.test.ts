import { describe, expect, it } from 'vitest';
import { GRUDGE_ALLY_TRUST_THRESHOLD, trustDeltaTowardPlayerFromAllyDeath } from '@/domain/social/inheritGrudgeRules';

describe('inheritGrudgeRules', () => {
  it('returns 0 when trust toward deceased is below threshold', () => {
    expect(trustDeltaTowardPlayerFromAllyDeath(GRUDGE_ALLY_TRUST_THRESHOLD - 1)).toBe(0);
    expect(trustDeltaTowardPlayerFromAllyDeath(0)).toBe(0);
  });

  it('returns negative delta when trust toward deceased is high', () => {
    const d = trustDeltaTowardPlayerFromAllyDeath(80);
    expect(d).toBeLessThan(0);
    expect(d).toBeGreaterThanOrEqual(-30);
  });

  it('returns 0 for non-finite input', () => {
    expect(trustDeltaTowardPlayerFromAllyDeath(Number.NaN)).toBe(0);
    expect(trustDeltaTowardPlayerFromAllyDeath(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('at threshold boundary applies formula', () => {
    expect(trustDeltaTowardPlayerFromAllyDeath(GRUDGE_ALLY_TRUST_THRESHOLD)).toBeLessThanOrEqual(0);
  });
});
