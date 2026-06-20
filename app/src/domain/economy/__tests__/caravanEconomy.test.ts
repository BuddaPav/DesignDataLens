import { describe, expect, it } from 'vitest';

import {
  applyMarketSupplyFromCaravanVisits,
  marketSupplyKeyForLocation,
  marketToneFromSupply,
  priceMultiplierFromMarketSupply,
  readMarketSupplyForLocation,
} from '@/domain/economy/caravanEconomy';
import { CHRONOS_MARKET_SUPPLY_VISIT_BOOST } from '@/domain/economy/caravanEconomyConstants';

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

  it('readMarketSupplyForLocation clamps and ignores missing keys', () => {
    const k = marketSupplyKeyForLocation('starting_village');
    const m = new Map<string, number>([[k, 77]]);
    expect(readMarketSupplyForLocation(m, 'starting_village')).toBe(77);
    expect(readMarketSupplyForLocation(m, 'unknown_loc')).toBe(0);
    expect(readMarketSupplyForLocation(undefined, 'starting_village')).toBe(0);
  });

  it('marketToneFromSupply follows configured bands', () => {
    expect(marketToneFromSupply(0)).toBe('tight');
    expect(marketToneFromSupply(30)).toBe('neutral');
    expect(marketToneFromSupply(90)).toBe('fluid');
  });

  it('visit boost matches exported constant (single source of truth)', () => {
    const k = marketSupplyKeyForLocation('x');
    const next = applyMarketSupplyFromCaravanVisits(new Map(), ['x'], 0, 1);
    expect(next.get(k)).toBe(CHRONOS_MARKET_SUPPLY_VISIT_BOOST);
  });
});

