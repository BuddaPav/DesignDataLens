// Загрузка ассетов Kimi / Art Bible: атлас мира 32×32, fallback если файлов ещё нет.
import type { BiomeKind } from '@/engine/worldTiles';
import { CHRONOS_ASSETS_BASE } from '@/domain/assets/chronosGraphicsRegistry';

export const CHRONOS_TILE_ART_PX = 32;
export { CHRONOS_ASSETS_BASE };

export interface WorldAtlasFrames {
  image: HTMLImageElement;
  /** biome_var01 → { x,y,w,h } в пикселях атласа */
  frames: Record<string, { x: number; y: number; w: number; h: number }>;
}

let cachedAtlas: WorldAtlasFrames | null = null;

export function resolveAtlasFrame(
  atlas: WorldAtlasFrames,
  baseName: string
): { x: number; y: number; w: number; h: number } | null {
  return atlas.frames[`${baseName}.png`] ?? atlas.frames[baseName] ?? null;
}

/** Путь к JSON TexturePacker / простому { frames: { name: {frame:{x,y,w,h}} } } */
export async function tryLoadWorldAtlas(): Promise<WorldAtlasFrames | null> {
  if (cachedAtlas) return cachedAtlas;
  const jsonUrl = `${CHRONOS_ASSETS_BASE}atlas/atlas_world_v01.json`;
  const imgUrl = `${CHRONOS_ASSETS_BASE}atlas/atlas_world_v01.png`;
  try {
    const [jsonRes, img] = await Promise.all([
      fetch(jsonUrl, { cache: 'no-store' }),
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('atlas img'));
        im.src = imgUrl;
      })
    ]);
    if (!jsonRes.ok) return null;
    const data = (await jsonRes.json()) as {
      frames?: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
    };
    const raw = data.frames ?? {};
    const frames: WorldAtlasFrames['frames'] = {};
    for (const [name, v] of Object.entries(raw)) {
      const f = v?.frame;
      if (f) frames[name] = { x: f.x, y: f.y, w: f.w, h: f.h };
    }
    if (Object.keys(frames).length === 0) return null;
    cachedAtlas = { image: img, frames };
    return cachedAtlas;
  } catch {
    return null;
  }
}

/** Сброс кэша (например после смены версии ассетов). */
export function clearWorldAtlasCache(): void {
  cachedAtlas = null;
}

/** Имя кадра для биома: biome_plains_var01 … var06 по хэшу тайла */
export function atlasFrameNameForBiome(biome: BiomeKind, tileX: number, tileY: number, seed: number): string {
  let h = seed ^ Math.imul(tileX, 0x9e3779b1) ^ Math.imul(tileY, 0x517cc1b7);
  h >>>= 0;
  const v = (h % 6) + 1;
  const pad = v < 10 ? `0${v}` : String(v);
  return `biome_${biome}_var${pad}`;
}
