/**
 * Чистая функция распространения слухов — может выполняться в Web Worker без доступа к NPCSystem.
 */
import type { ActiveRumor } from '@/types/game';
import {
  CHRONOS_GOSSIP_NEW_LOCATIONS_PER_SPREAD_MAX,
  CHRONOS_GOSSIP_REACHED_LOCATIONS_CAP,
} from '@/domain/social/gossipSpreadConstants';

export type RumorSpreadDTO = {
  id: string;
  ttlHours: number;
  originLocationId: string;
  reachedLocationIds: string[];
  message: string;
  severity?: 'info' | 'rumor' | 'dramatic';
  factionTags: string[];
};

function rng(): number {
  return Math.random();
}

export function activeRumorToDto(a: ActiveRumor): RumorSpreadDTO {
  return {
    id: a.id,
    message: a.message,
    severity: a.severity,
    ttlHours: a.ttlHours,
    originLocationId: a.originLocationId,
    factionTags: [...a.factionTags],
    reachedLocationIds: [...a.reachedLocationIds],
  };
}

export function dtoToActiveRumor(r: RumorSpreadDTO): ActiveRumor {
  return {
    id: r.id,
    message: r.message,
    severity: r.severity,
    ttlHours: r.ttlHours,
    originLocationId: r.originLocationId,
    factionTags: [...r.factionTags],
    reachedLocationIds: [...r.reachedLocationIds],
  };
}

function trimReachedLocations(r: RumorSpreadDTO, reach: Set<string>): string[] {
  const cap = CHRONOS_GOSSIP_REACHED_LOCATIONS_CAP;
  if (reach.size <= cap) return [...reach];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    if (out.length >= cap || seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  push(r.originLocationId);
  for (const id of r.reachedLocationIds) push(id);
  for (const id of reach) push(id);
  return out;
}

/** Сжигает TTL и распространяет охват по рёбрам графа локаций. */
export function decayAndSpreadRumors(
  rumors: RumorSpreadDTO[],
  hours: number,
  adjacency: Record<string, string[]>
): RumorSpreadDTO[] {
  const h = Math.min(168, Math.max(0, hours));
  const intensity = Math.min(1, h / 12);

  const alive = burnRumorTtl(rumors, h);

  for (const r of alive) {
    const reach = new Set(r.reachedLocationIds);
    const frontier = [...r.reachedLocationIds];
    let addedThisSpread = 0;
    spread: for (const loc of frontier) {
      const neighbors = adjacency[loc];
      if (!neighbors) continue;
      for (const next of neighbors) {
        if (reach.has(next)) continue;
        if (rng() < 0.12 * intensity) {
          reach.add(next);
          addedThisSpread++;
          if (addedThisSpread >= CHRONOS_GOSSIP_NEW_LOCATIONS_PER_SPREAD_MAX) break spread;
        }
      }
    }
    r.reachedLocationIds = trimReachedLocations(r, reach);
  }

  return alive;
}

/** Только сжигает TTL и отбрасывает умершие, без расширения охвата. */
export function burnRumorTtl(rumors: RumorSpreadDTO[], hours: number): RumorSpreadDTO[] {
  const h = Math.min(168, Math.max(0, hours));
  return rumors
    .map((r) => ({ ...r, ttlHours: r.ttlHours - h }))
    .filter((r) => r.ttlHours > 0);
}
