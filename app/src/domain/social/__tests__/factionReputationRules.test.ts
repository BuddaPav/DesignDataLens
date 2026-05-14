import { describe, expect, it } from 'vitest';

import {
  clampFactionReputation,
  collectFactionRepShiftLines,
  formatStoryReputationChoiceLogLine,
  mergeFactionReputation,
  reputationDeltaFromRumorSpread,
} from '@/domain/social/factionReputationRules';
import type { ActiveRumor } from '@/types/game';

const rumor = (partial: Partial<ActiveRumor> & Pick<ActiveRumor, 'id'>): ActiveRumor => ({
  message: 'm',
  severity: 'rumor',
  ttlHours: 10,
  originLocationId: 'a',
  factionTags: [],
  reachedLocationIds: ['a'],
  ...partial,
});

describe('factionReputationRules', () => {
  it('clampFactionReputation', () => {
    expect(clampFactionReputation(200)).toBe(100);
    expect(clampFactionReputation(-200)).toBe(-100);
    expect(clampFactionReputation(12.4)).toBe(12);
  });

  it('mergeFactionReputation sums and clamps', () => {
    const next = mergeFactionReputation({ thieves_guild: 90 }, { thieves_guild: 20 });
    expect(next.thieves_guild).toBe(100);
  });

  it('reputationDeltaFromRumorSpread when reach grows', () => {
    const before = [
      rumor({
        id: 'r1',
        factionTags: ['thieves_guild'],
        reachedLocationIds: ['starting_village'],
      }),
    ];
    const after = [
      rumor({
        id: 'r1',
        factionTags: ['thieves_guild'],
        reachedLocationIds: ['starting_village', 'whispering_forest'],
      }),
    ];
    const d = reputationDeltaFromRumorSpread(before, after);
    expect(d.thieves_guild).toBeLessThan(0);
    expect(d.thieves_guild).toBeGreaterThan(-5);
  });

  it('ignores new rumors without matching before id', () => {
    const before: ActiveRumor[] = [];
    const after = [rumor({ id: 'new', factionTags: ['academy'], reachedLocationIds: ['x'] })];
    expect(reputationDeltaFromRumorSpread(before, after)).toEqual({});
  });

  it('collectFactionRepShiftLines skips tiny deltas', () => {
    expect(collectFactionRepShiftLines({ thieves_guild: -0.2 }, 'en')).toEqual([]);
  });

  it('collectFactionRepShiftLines emits localized line', () => {
    const lines = collectFactionRepShiftLines({ thieves_guild: -1.2 }, 'en');
    expect(lines.length).toBe(1);
    expect(lines[0].toLowerCase()).toContain('thieves');
  });

  it('formatStoryReputationChoiceLogLine is null for non-core keys', () => {
    expect(formatStoryReputationChoiceLogLine('village_elara', 5, 'en')).toBeNull();
  });

  it('formatStoryReputationChoiceLogLine for core faction', () => {
    const s = formatStoryReputationChoiceLogLine('academy', 3, 'en');
    expect(s).toBeTruthy();
    expect(s!.toLowerCase()).toContain('academy');
  });
});
