import { describe, expect, it } from 'vitest';

import {
  applyMarketSupplyFromCaravanVisits,
  marketSupplyKeyForLocation,
  priceMultiplierFromMarketSupply,
} from '@/domain/economy/caravanEconomy';

describe('caravanEconomy', () => {
  it('boosts supply for visited locations and decays over hours', () => {
    const prev = new Map<string, number>();
    const loc = 'starting_village';
    const k = marketSupplyKeyForLocation(loc);
    const next1 = applyMarketSupplyFromCaravanVisits(prev, [loc], 6, 0.99);
    expect(next1.get(k)).toBeGreaterThan(0);
    const next2 = applyMarketSupplyFromCaravanVisits(next1, [], 10, 0.99);
    expect((next2.get(k) ?? 0)).toBeLessThan(next1.get(k) ?? 0);
  });

  it('multiplier decreases with higher supply', () => {
    expect(priceMultiplierFromMarketSupply(0)).toBeGreaterThan(priceMultiplierFromMarketSupply(60));
  });
});

