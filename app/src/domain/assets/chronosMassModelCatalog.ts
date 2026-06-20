export const CHRONOS_MASS_MODEL_COUNT = 1000;

function padded(index: number): string {
  return String(index).padStart(4, '0');
}

function clampedIndex(index: number): number {
  if (!Number.isFinite(index) || index < 1) return 1;
  if (index > CHRONOS_MASS_MODEL_COUNT) return CHRONOS_MASS_MODEL_COUNT;
  return Math.floor(index);
}

export function chronosMassModelLodPath(index: number, lod: 0 | 1 | 2): string {
  const i = clampedIndex(index);
  const id = padded(i);
  return `models/aaa/bulk/prop_bulk_gen_${id}_lod${lod}.gltf`;
}

export function chronosMassModelLodSet(index: number): [string, string, string] {
  return [
    chronosMassModelLodPath(index, 0),
    chronosMassModelLodPath(index, 1),
    chronosMassModelLodPath(index, 2),
  ];
}

// =============================================================================
// Quality Models (proper geometry, not triangle soup)
// =============================================================================

export type QualityAssetId =
  | 'tree_pine' | 'tree_oak' | 'tree_dead'
  | 'rock_large' | 'rock_small'
  | 'crystal_blue' | 'crystal_purple' | 'crystal_green'
  | 'building_tower' | 'building_house'
  | 'barrel' | 'crate' | 'campfire'
  | 'lantern' | 'boulder' | 'stump'
  | 'mushroom' | 'signpost';

// Map of quality asset names to their names (for display/lookup)
export const CHRONOS_QUALITY_ASSETS: Record<QualityAssetId, string> = {
  tree_pine: 'Pine Tree',
  tree_oak: 'Oak Tree',
  tree_dead: 'Dead Tree',
  rock_large: 'Large Rock',
  rock_small: 'Small Rock',
  crystal_blue: 'Blue Crystal',
  crystal_purple: 'Purple Crystal',
  crystal_green: 'Green Crystal',
  building_tower: 'Tower',
  building_house: 'House',
  barrel: 'Barrel',
  crate: 'Crate',
  campfire: 'Campfire',
  lantern: 'Lantern',
  boulder: 'Boulder',
  stump: 'Tree Stump',
  mushroom: 'Mushroom',
  signpost: 'Signpost',
};

export function chronosQualityModelPath(assetId: QualityAssetId, lod: 0 | 1 | 2): string {
  return `models/aaa/quality/${assetId}_lod${lod}.gltf`;
}

export function chronosQualityModelLodSet(assetId: QualityAssetId): [string, string, string] {
  return [
    chronosQualityModelPath(assetId, 0),
    chronosQualityModelPath(assetId, 1),
    chronosQualityModelPath(assetId, 2),
  ];
}
