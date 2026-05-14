/**
 * Единый реестр публичной графики Chronos: URL + спецификация + строка замены финального ассета.
 * Импортируйте отсюда пути — не дублируйте строки в компонентах.
 */

export const CHRONOS_GRAPHICS_ROOT = `${import.meta.env.BASE_URL}assets/chronos-ai-chronicles/`;

/** Совместимость с `engine/chronosAssets.ts` — один корень для всех Kimi-ассетов */
export const CHRONOS_ASSETS_BASE = CHRONOS_GRAPHICS_ROOT;

export type GraphicsPriority = 'critical' | 'high' | 'medium';
export type GraphicsStatus =
  | 'shipped'
  | 'procedural'
  | 'optional_pipeline'
  | 'placeholder_vector';

export interface GraphicsAssetEntry {
  /** Стабильный ключ для поиска в коде и доках */
  id: string;
  category: 'environment' | 'character' | 'ui' | 'effects' | 'icons_fonts' | 'shader_3d';
  /** Относительно CHRONOS_GRAPHICS_ROOT или виртуальный идентификатор */
  pathOrVirtual: string;
  format: 'png' | 'json' | 'svg' | 'shader_ts' | 'canvas_procedural' | 'none';
  /** Целевой или фактический размер для растров */
  spec: string;
  style: string;
  priority: GraphicsPriority;
  status: GraphicsStatus;
  /** Одна строка: как подменить на финальный арт без правок по всему репо */
  swap: string;
}

/** Разрешить URL для файла под корнем chronos-ai-chronicles */
export function chronosGraphicsUrl(relativePath: string): string {
  const p = relativePath.replace(/^\/+/, '');
  return `${CHRONOS_GRAPHICS_ROOT}${p}`;
}

/** Интро: статичный сплэш по умолчанию */
export function chronosSplashDefaultUrl(): string {
  return chronosGraphicsUrl('chronos_splash_art.png');
}

/** Опционально: manifest из `npm run generate:ai-art` */
export function chronosGeneratedManifestUrl(): string {
  return chronosGraphicsUrl('generated/manifest.json');
}

/** Векторная заглушка (SVG) — если растр недоступен, подставить в <img src={...} /> */
export function chronosPlaceholderGlyphUrl(): string {
  return chronosGraphicsUrl('ui/chronos_glyph_placeholder.svg');
}

export function npcPortraitFrameUrl(): string {
  return chronosGraphicsUrl('npc/npc_portrait_frame_128.png');
}

export function npcMedallionFrameUrl(): string {
  return chronosGraphicsUrl('npc/npc_medallion_frame_64.png');
}

export function uiIconQuestUrl(): string {
  return chronosGraphicsUrl('ui/ui_icon_quest_24.png');
}

export function uiIconCloseUrl(): string {
  return chronosGraphicsUrl('ui/ui_icon_close_24.png');
}

/**
 * Файлы под `public/assets/chronos-ai-chronicles/`, которые должны появляться после `npm run prebuild`.
 * Используется для контракт-тестов и сверки пайплайна (не дублировать строки вне этого списка без обновления).
 */
export const CHRONOS_CONTRACT_PUBLIC_FILES = [
  'chronos_splash_art.png',
  'ui/chronos_glyph_placeholder.svg',
  'npc/npc_portrait_frame_128.png',
  'npc/npc_medallion_frame_64.png',
  'npc/npc_status_friendly.png',
  'npc/npc_status_hostile.png',
  'npc/npc_status_stressed.png',
  'npc/npc_status_dead.png',
  'ui/ui_icon_quest_24.png',
  'ui/ui_icon_close_24.png',
  'atlas/atlas_world_v01.png',
  'atlas/atlas_world_v01.json',
  'atlas/atlas_npc_v01.png',
  'atlas/atlas_npc_v01.json',
  'atlas/atlas_ui_v01.png',
  'atlas/atlas_ui_v01.json',
] as const;

/**
 * Полный перечень известных точек графики (аудит Orchestrate).
 * Процедурные системы перечислены virtual path для трассировки.
 */
export const CHRONOS_GRAPHICS_REGISTRY: readonly GraphicsAssetEntry[] = [
  {
    id: 'splash_default',
    category: 'environment',
    pathOrVirtual: 'chronos_splash_art.png',
    format: 'png',
    spec: 'hero backdrop, full-bleed intro',
    style: 'dark fantasy / neon accent',
    priority: 'critical',
    status: 'shipped',
    swap: 'Заменить файл `public/assets/chronos-ai-chronicles/chronos_splash_art.png`; URL берётся из chronosSplashDefaultUrl().',
  },
  {
    id: 'splash_generated',
    category: 'environment',
    pathOrVirtual: 'generated/*',
    format: 'png',
    spec: 'optional backdrop from AI art pipeline',
    style: 'manifest-driven',
    priority: 'high',
    status: 'optional_pipeline',
    swap: 'Положить `generated/backdrop.png` + manifest; IntroScreen подхватит через fetch manifest.',
  },
  {
    id: 'world_atlas',
    category: 'environment',
    pathOrVirtual: 'atlas/atlas_world_v01.png',
    format: 'png',
    spec: 'TexturePacker atlas ~1024×96 (see prebuild)',
    style: 'tile sprites 32×32 biome tiles',
    priority: 'critical',
    status: 'shipped',
    swap: 'Обновить JSON+PNG в atlas/, пересобрать; см. `engine/chronosAssets.ts` tryLoadWorldAtlas.',
  },
  {
    id: 'npc_frame_portrait',
    category: 'character',
    pathOrVirtual: 'npc/npc_portrait_frame_128.png',
    format: 'png',
    spec: '128×128 frame',
    style: 'Chronos NPC portrait rim',
    priority: 'high',
    status: 'shipped',
    swap: 'Заменить PNG в npc/; искать импорты через grep npc_portrait_frame.',
  },
  {
    id: 'npc_frame_medallion',
    category: 'character',
    pathOrVirtual: 'npc/npc_medallion_frame_64.png',
    format: 'png',
    spec: '64×64',
    style: 'medallion',
    priority: 'medium',
    status: 'shipped',
    swap: 'Заменить npc/npc_medallion_frame_64.png.',
  },
  {
    id: 'npc_status_hostile',
    category: 'ui',
    pathOrVirtual: 'npc/npc_status_hostile.png',
    format: 'png',
    spec: 'status glyph',
    style: 'Kenney Game Icons CC0 (fist)',
    priority: 'high',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`; см. `third_party/kenney-game-icons/LICENSE.txt`.',
  },
  {
    id: 'npc_status_friendly',
    category: 'ui',
    pathOrVirtual: 'npc/npc_status_friendly.png',
    format: 'png',
    spec: 'status glyph',
    style: 'Kenney Game Icons CC0 (heart)',
    priority: 'high',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`.',
  },
  {
    id: 'npc_status_stressed',
    category: 'ui',
    pathOrVirtual: 'npc/npc_status_stressed.png',
    format: 'png',
    spec: 'status glyph',
    style: 'Kenney Game Icons CC0 (warning)',
    priority: 'high',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`.',
  },
  {
    id: 'npc_status_dead',
    category: 'ui',
    pathOrVirtual: 'npc/npc_status_dead.png',
    format: 'png',
    spec: 'status glyph',
    style: 'Kenney Game Icons CC0 (minus circle)',
    priority: 'high',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`.',
  },
  {
    id: 'ui_icon_quest',
    category: 'ui',
    pathOrVirtual: 'ui/ui_icon_quest_24.png',
    format: 'png',
    spec: '24×24',
    style: 'Kenney Game Icons CC0 (flag)',
    priority: 'medium',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`.',
  },
  {
    id: 'ui_icon_close',
    category: 'ui',
    pathOrVirtual: 'ui/ui_icon_close_24.png',
    format: 'png',
    spec: '24×24',
    style: 'Kenney Game Icons CC0 (times)',
    priority: 'medium',
    status: 'shipped',
    swap: 'Перегенерация: `npm run vendor:kenney-icons`.',
  },
  {
    id: 'ui_placeholder_glyph',
    category: 'icons_fonts',
    pathOrVirtual: 'ui/chronos_glyph_placeholder.svg',
    format: 'svg',
    spec: '64×64 viewBox scalable',
    style: 'vector monogram',
    priority: 'medium',
    status: 'placeholder_vector',
    swap: 'Заменить SVG или указать chronosPlaceholderGlyphUrl() в компоненте при ошибке загрузки растра.',
  },
  {
    id: 'pwa_icons',
    category: 'icons_fonts',
    pathOrVirtual: 'public/icons/icon-*.png',
    format: 'png',
    spec: '72–512 multi',
    style: 'app icon maskable',
    priority: 'critical',
    status: 'shipped',
    swap: 'Папка `app/public/icons/` + manifest.json.',
  },
  {
    id: 'world_3d_terrain',
    category: 'shader_3d',
    pathOrVirtual: 'virtual:WorldScene3D terrain mesh',
    format: 'shader_ts',
    spec: 'segments 256² regions',
    style: 'simplex displacement + biome tint',
    priority: 'critical',
    status: 'procedural',
    swap: 'Код: `WorldScene3D.tsx` + `simplex3d.glsl.ts`; править uniform/geometry, не файлы в public.',
  },
  {
    id: 'water_surface',
    category: 'shader_3d',
    pathOrVirtual: 'virtual:WaterSurface',
    format: 'shader_ts',
    spec: 'plane 144×144 segments tiered',
    style: 'reflective water shader',
    priority: 'critical',
    status: 'procedural',
    swap: 'Файл `rendering/WaterSurface.tsx` + MeshReflectorMaterial.',
  },
  {
    id: 'post_fx',
    category: 'effects',
    pathOrVirtual: 'virtual:WorldPostFX',
    format: 'none',
    spec: 'bloom / god rays / smaa tiered',
    style: 'cinematic grade',
    priority: 'high',
    status: 'procedural',
    swap: 'Компонент `WorldPostFX.tsx`; параметры от WorldGraphicsTier.',
  },
  {
    id: 'fonts_ui',
    category: 'icons_fonts',
    pathOrVirtual: '@fontsource/exo-2 + @fontsource/inter',
    format: 'none',
    spec: 'woff2 via CSS imports in main.tsx',
    style: 'Art Bible typography',
    priority: 'critical',
    status: 'shipped',
    swap: 'Пакеты `@fontsource/inter` / `@fontsource/exo-2` и импорты в `app/src/main.tsx`; Tailwind `font-sans` / `font-display`.',
  },
] as const;
