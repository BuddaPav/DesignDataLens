import { describe, expect, it } from 'vitest';

import { STORY_LOCATIONS } from '@/domain/world/storyLocations';

function graphIsConnected(ids: string[], neighbors: Map<string, string[]>): boolean {
  if (!ids.length) return true;
  const seen = new Set<string>();
  const q: string[] = [ids[0]!];
  while (q.length > 0) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const n of neighbors.get(id) ?? []) {
      if (!seen.has(n)) q.push(n);
    }
  }
  return seen.size === ids.length;
}

describe('storyLocations graph', () => {
  it('uses unique location ids', () => {
    const ids = STORY_LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has only known neighbors and symmetric edges', () => {
    const ids = new Set(STORY_LOCATIONS.map((l) => l.id));
    const byId = new Map(STORY_LOCATIONS.map((l) => [l.id, l]));
    for (const loc of STORY_LOCATIONS) {
      for (const n of loc.connectedLocations) {
        expect(ids.has(n)).toBe(true);
        expect(byId.get(n)?.connectedLocations.includes(loc.id)).toBe(true);
      }
    }
  });

  it('stays connected for the playable region graph', () => {
    const ids = STORY_LOCATIONS.map((l) => l.id);
    const neighbors = new Map(STORY_LOCATIONS.map((l) => [l.id, l.connectedLocations]));
    expect(graphIsConnected(ids, neighbors)).toBe(true);
  });
});
