import { describe, expect, it } from 'vitest';

import {
  assertTradeRoutesMatchLocationGraph,
  CHRONOS_TRADE_ROUTES,
} from '@/engine/traderCaravan';
import { STORY_LOCATIONS } from '@/domain/world/storyLocations';

describe('traderCaravan graph alignment', () => {
  it('CHRONOS_TRADE_ROUTES only uses edges from the story location graph', () => {
    expect(() =>
      assertTradeRoutesMatchLocationGraph(CHRONOS_TRADE_ROUTES, STORY_LOCATIONS),
    ).not.toThrow();
  });
});
