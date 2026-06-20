import { describe, expect, it } from 'vitest';

import { applyMarketSupplyFromCaravanVisits, marketSupplyKeyForLocation } from '@/domain/economy/caravanEconomy';
import { CHRONOS_TRADE_ROUTES, ensureDefaultCaravans, tickTradeCaravans } from '@/engine/traderCaravan';
import type { WorldLogEntry } from '@/types/game';

describe('caravan ticks → market supply', () => {
  it('after long advance simulation, caravan visits raise market_supply keys', () => {
    const caravans = ensureDefaultCaravans(undefined);
    const log: WorldLogEntry[] = [];
    const visited = tickTradeCaravans(caravans, CHRONOS_TRADE_ROUTES, [], 220, log, 'en');
    expect(visited.length).toBeGreaterThan(0);

    const fp = applyMarketSupplyFromCaravanVisits(new Map(), visited, 1);
    let maxSupply = 0;
    for (const [key, v] of fp.entries()) {
      if (key.startsWith('market_supply:')) {
        maxSupply = Math.max(maxSupply, v ?? 0);
      }
    }
    expect(maxSupply).toBeGreaterThan(0);

    const locIds = new Set(visited);
    for (const loc of locIds) {
      const k = marketSupplyKeyForLocation(loc);
      expect((fp.get(k) ?? 0) > 0).toBe(true);
    }
  });
});
