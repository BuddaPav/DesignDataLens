import { describe, expect, it } from 'vitest';
import type { ActiveRumor } from '@/types/game';
import { collectFactionTagsFromRumors, filterRumorsForView } from '@/domain/social/rumorViewRules';

const r = (partial: Partial<ActiveRumor> & Pick<ActiveRumor, 'id'>): ActiveRumor => ({
  message: 'm',
  severity: 'rumor',
  ttlHours: 10,
  originLocationId: 'starting_village',
  factionTags: [],
  reachedLocationIds: ['starting_village'],
  ...partial,
});

describe('rumorViewRules', () => {
  it('filters by reached location', () => {
    const rumors = [
      r({ id: 'a', reachedLocationIds: ['starting_village'] }),
      r({ id: 'b', reachedLocationIds: ['old_ruins'] }),
    ];
    expect(filterRumorsForView(rumors, { onlyReachedLocationId: 'old_ruins' }).map((x) => x.id)).toEqual(['b']);
  });

  it('filters by faction tag', () => {
    const rumors = [r({ id: 'a', factionTags: ['academy'] }), r({ id: 'b', factionTags: [] })];
    expect(filterRumorsForView(rumors, { factionTag: 'academy' }).map((x) => x.id)).toEqual(['a']);
  });

  it('hides expired by default', () => {
    const rumors = [r({ id: 'a', ttlHours: -1 }), r({ id: 'b', ttlHours: 1 })];
    expect(filterRumorsForView(rumors, {}).map((x) => x.id)).toEqual(['b']);
  });

  it('collects unique faction tags', () => {
    const rumors = [r({ id: 'a', factionTags: ['academy', 'academy'] }), r({ id: 'b', factionTags: ['thieves_guild'] })];
    expect(collectFactionTagsFromRumors(rumors)).toEqual(['academy', 'thieves_guild']);
  });
});

