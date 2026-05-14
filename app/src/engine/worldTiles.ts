// Процедурный открытый мир: шум, биомы, чанки 50×50 тайлов, якоря локаций.
// Масштаб до 1 000 000 × 1 000 000 тайлов — координаты целочисленные или дробные для плавного движения.

import type { NPC, WorldPosition } from '@/types/game';

export const WORLD_SIZE = 1_000_000;
export const CHUNK_SIZE = 50;
/** Размер тайла на экране (px) — баланс детализации и FPS */
export const TILE_PX = 10;

export type BiomeKind = 'deep_water' | 'shallow' | 'beach' | 'plains' | 'forest' | 'hills' | 'mountain' | 'snow' | 'desert' | 'ruins';

/** Якоря сюжетных локаций на глобальной сетке (согласовано с initialLocations в useGameState) */
const LOCATION_ANCHORS: Record<string, { x: number; y: number; labelRu: string }> = {
  starting_village: { x: 500_000, y: 500_000, labelRu: 'Willbrook' },
  whispering_forest: { x: 500_220, y: 499_880, labelRu: 'Шепчущий лес' },
  old_ruins: { x: 499_780, y: 500_240, labelRu: 'Руины' }
};

export function getLocationAnchor(locationId: string): { x: number; y: number; labelRu: string } {
  return LOCATION_ANCHORS[locationId] ?? { x: 500_000, y: 500_000, labelRu: '?' };
}

/** Устойчивый хэш → [0, 1) — для вариации оттенка тайла на Canvas */
export function tileHash01(x: number, y: number, seed: number): number {
  let n = Math.imul(x ^ seed, 0x27d4eb2d) ^ Math.imul(y ^ (seed << 3), 0x165667b1);
  n = Math.imul(n ^ (n >>> 15), 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return ((n >>> 0) % 0xfffffff) / 0xfffffff;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Билинейная интерполяция шума на сетке */
function noise2D(x: number, y: number, seed: number, scale: number): number {
  const fx = x / scale;
  const fy = y / scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = smooth(fx - x0);
  const ty = smooth(fy - y0);
  const n00 = tileHash01(x0, y0, seed);
  const n10 = tileHash01(x0 + 1, y0, seed);
  const n01 = tileHash01(x0, y0 + 1, seed);
  const n11 = tileHash01(x0 + 1, y0 + 1, seed);
  const ix0 = n00 * (1 - tx) + n10 * tx;
  const ix1 = n01 * (1 - tx) + n11 * tx;
  return ix0 * (1 - ty) + ix1 * ty;
}

export function elevationAt(tileX: number, tileY: number, seed: number): number {
  const e =
    noise2D(tileX, tileY, seed, 180) * 0.55 +
    noise2D(tileX, tileY, seed + 11, 60) * 0.28 +
    noise2D(tileX, tileY, seed + 29, 24) * 0.17;
  return e;
}

export function moistureAt(tileX: number, tileY: number, seed: number): number {
  return noise2D(tileX, tileY, seed + 101, 140) * 0.6 + noise2D(tileX, tileY, seed + 77, 55) * 0.4;
}

export function biomeAt(tileX: number, tileY: number, seed: number): BiomeKind {
  const e = elevationAt(tileX, tileY, seed);
  const m = moistureAt(tileX, tileY, seed);
  const ruins = tileHash01(Math.floor(tileX / 80), Math.floor(tileY / 80), seed + 999) > 0.985;

  if (e < 0.28) return 'deep_water';
  if (e < 0.34) return 'shallow';
  if (e < 0.38) return 'beach';
  if (ruins && e > 0.42 && e < 0.62) return 'ruins';
  if (e > 0.72 && m < 0.35) return 'snow';
  if (e > 0.65) return m > 0.45 ? 'snow' : 'mountain';
  if (e > 0.52) return 'hills';
  if (m > 0.55 && e < 0.58) return 'forest';
  if (m < 0.28 && e > 0.4 && e < 0.55) return 'desert';
  return 'plains';
}

/** Верхний и нижний цвет тайла (вертикальный градиент в рендерере) */
export function biomeColors(biome: BiomeKind): { top: string; bottom: string; glow: string } {
  switch (biome) {
    case 'deep_water':
      return { top: '#0a1628', bottom: '#153d52', glow: '#2a8a9a' };
    case 'shallow':
      return { top: '#1a4f62', bottom: '#2a6f85', glow: '#45a29e' };
    case 'beach':
      return { top: '#c9b896', bottom: '#a89872', glow: '#e8dcc8' };
    case 'plains':
      return { top: '#3d6e42', bottom: '#2d5530', glow: '#6ecf78' };
    case 'forest':
      return { top: '#1a4a32', bottom: '#0f2e20', glow: '#3d8c62' };
    case 'hills':
      return { top: '#5a6d4e', bottom: '#3d4a38', glow: '#8faa7a' };
    case 'mountain':
      return { top: '#6a6d78', bottom: '#454850', glow: '#a8b0c0' };
    case 'snow':
      return { top: '#dfefff', bottom: '#a8c0d8', glow: '#ffffff' };
    case 'desert':
      return { top: '#d4b87a', bottom: '#b89a52', glow: '#f0e0a8' };
    case 'ruins':
      return { top: '#4a4558', bottom: '#2e2a38', glow: '#9b86c8' };
    default:
      return { top: '#334433', bottom: '#223322', glow: '#556655' };
  }
}

/** Стабильная позиция NPC рядом с якорем локации */
export function npcWorldTile(npc: NPC): { x: number; y: number } {
  if (npc.worldTile) {
    return { x: npc.worldTile.x, y: npc.worldTile.y };
  }
  const anchor = getLocationAnchor(npc.location);
  let h = 0;
  for (let i = 0; i < npc.id.length; i++) {
    h = (Math.imul(h, 31) + npc.id.charCodeAt(i)) >>> 0;
  }
  const angle = (h % 360) * (Math.PI / 180);
  const r = 12 + (h % 28);
  return {
    x: anchor.x + Math.cos(angle) * r,
    y: anchor.y + Math.sin(angle) * r
  };
}

/** id сюжетной локации, если тайл в радиусе от якоря */
export function nearestLocationId(tileX: number, tileY: number, maxDist = 200): string {
  let best: { id: string; d: number } | null = null;
  for (const [id, a] of Object.entries(LOCATION_ANCHORS)) {
    const dx = tileX - a.x;
    const dy = tileY - a.y;
    const d = Math.hypot(dx, dy);
    if (d <= maxDist && (!best || d < best.d)) {
      best = { id, d };
    }
  }
  return best?.id ?? 'starting_village';
}

/** Имя ближайшей известной локации, если в радиусе */
export function nearestLocationLabel(tileX: number, tileY: number, maxDist = 90): string | null {
  let best: { id: string; d: number } | null = null;
  for (const [id, a] of Object.entries(LOCATION_ANCHORS)) {
    const dx = tileX - a.x;
    const dy = tileY - a.y;
    const d = Math.hypot(dx, dy);
    if (d <= maxDist && (!best || d < best.d)) {
      best = { id, d };
    }
  }
  if (!best) return null;
  return LOCATION_ANCHORS[best.id]?.labelRu ?? null;
}

/** Случайная точка у якоря (при быстром путешествии) */
export function randomPointNearAnchor(locationId: string, seed: number): WorldPosition {
  const a = getLocationAnchor(locationId);
  const h = tileHash01(seed, locationId.length, 42);
  const ang = h * Math.PI * 2;
  const r = 8 + (tileHash01(seed + 1, 0, 7) * 35);
  return clampWorldPosition({
    tileX: a.x + Math.cos(ang) * r,
    tileY: a.y + Math.sin(ang) * r
  });
}

export function clampWorldPosition(p: WorldPosition): WorldPosition {
  return {
    tileX: Math.max(0, Math.min(WORLD_SIZE - 1, p.tileX)),
    tileY: Math.max(0, Math.min(WORLD_SIZE - 1, p.tileY))
  };
}
