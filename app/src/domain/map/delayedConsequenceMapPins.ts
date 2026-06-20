import type { DelayedConsequencePending } from '@/types/game';
import { randomPointNearAnchor } from '@/engine/worldTiles';

export type DelayedConsequenceMapPin = {
  id: string;
  tileX: number;
  tileY: number;
  locationId: string;
  remainingHours: number;
  consequenceType: DelayedConsequencePending['consequence']['type'];
  source: DelayedConsequencePending['source'];
};

const DEFAULT_MAX_PINS = 24;

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Якоря отложенных последствий на тактической карте (эхо «бабочки»).
 */
export function buildDelayedConsequenceMapPins(
  queue: DelayedConsequencePending[] | undefined,
  maxPins = DEFAULT_MAX_PINS,
): DelayedConsequenceMapPin[] {
  if (!queue?.length) return [];
  const sorted = [...queue].sort((a, b) => a.remainingHours - b.remainingHours);
  const pins: DelayedConsequenceMapPin[] = [];

  for (const p of sorted.slice(0, maxPins)) {
    const pt = randomPointNearAnchor(p.locationId, hashId(p.id));
    pins.push({
      id: p.id,
      tileX: Math.floor(pt.tileX),
      tileY: Math.floor(pt.tileY),
      locationId: p.locationId,
      remainingHours: p.remainingHours,
      consequenceType: p.consequence.type,
      source: p.source,
    });
  }

  return pins;
}
