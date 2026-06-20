import { describe, expect, it } from 'vitest';

import { CHRONOS_TRADE_ROUTES, ensureDefaultCaravans } from '@/engine/traderCaravan';

describe('ensureDefaultCaravans', () => {
  it('covers every declared trade route without duplicates', () => {
    const defaults = ensureDefaultCaravans(undefined);
    const routeIds = defaults.map((c) => c.routeId);
    const unique = new Set(routeIds);

    expect(unique.size).toBe(routeIds.length);
    for (const route of CHRONOS_TRADE_ROUTES) {
      expect(unique.has(route.id)).toBe(true);
    }
  });
});
