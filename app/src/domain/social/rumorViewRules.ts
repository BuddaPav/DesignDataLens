import type { ActiveRumor } from '@/types/game';

export type RumorViewFilter = {
  /** If set, only rumors that reached this location are shown. */
  onlyReachedLocationId?: string;
  /** If set, only rumors containing this faction tag are shown. */
  factionTag?: string;
  /** If true, hide rumors with ttlHours <= 0 (usually already filtered upstream). */
  hideExpired?: boolean;
};

export function filterRumorsForView(rumors: ActiveRumor[], f: RumorViewFilter): ActiveRumor[] {
  const loc = f.onlyReachedLocationId?.trim();
  const tag = f.factionTag?.trim();
  const hideExpired = f.hideExpired !== false;

  return rumors.filter((r) => {
    if (hideExpired && r.ttlHours <= 0) return false;
    if (loc && !r.reachedLocationIds.includes(loc)) return false;
    if (tag && !r.factionTags.includes(tag)) return false;
    return true;
  });
}

export function collectFactionTagsFromRumors(rumors: ActiveRumor[]): string[] {
  const out = new Set<string>();
  for (const r of rumors) {
    for (const tag of r.factionTags) out.add(tag);
  }
  return [...out].sort();
}

