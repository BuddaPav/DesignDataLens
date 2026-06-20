import { CHRONOS_GRAPHICS_REGISTRY, type GraphicsAssetEntry } from './chronosGraphicsRegistry';

export type ProductionLifecycleStatus =
  | 'blockout'
  | 'review'
  | 'approved'
  | 'integrated'
  | 'deprecated';

export interface ProductionAssetMetadata {
  version: string;
  owner: string;
  license: string;
  lodProfile: 'none' | 'lod0-2' | 'lod0-3';
  rigVersion: string | null;
  lifecycleStatus: ProductionLifecycleStatus;
}

export interface ProductionGraphicsAssetEntry extends GraphicsAssetEntry {
  production: ProductionAssetMetadata;
}

function defaultLifecycleFor(asset: GraphicsAssetEntry): ProductionLifecycleStatus {
  if (asset.status === 'shipped') return 'integrated';
  if (asset.status === 'placeholder_vector') return 'review';
  return 'blockout';
}

function defaultLodProfileFor(asset: GraphicsAssetEntry): ProductionAssetMetadata['lodProfile'] {
  if (asset.category === 'character' || asset.category === 'environment') return 'lod0-2';
  return 'none';
}

function defaultOwnerFor(asset: GraphicsAssetEntry): string {
  if (asset.category === 'character') return 'character-team';
  if (asset.category === 'environment') return 'environment-team';
  if (asset.category === 'ui' || asset.category === 'icons_fonts') return 'ui-team';
  return 'technical-art-team';
}

function defaultLicenseFor(asset: GraphicsAssetEntry): string {
  if (asset.style.includes('Kenney Game Icons CC0')) return 'CC0';
  return 'internal-ip';
}

export const CHRONOS_PRODUCTION_GRAPHICS_REGISTRY: readonly ProductionGraphicsAssetEntry[] =
  CHRONOS_GRAPHICS_REGISTRY.map((asset) => ({
    ...asset,
    production: {
      version: 'v1',
      owner: defaultOwnerFor(asset),
      license: defaultLicenseFor(asset),
      lodProfile: defaultLodProfileFor(asset),
      rigVersion: asset.category === 'character' ? 'humanoid_v1' : null,
      lifecycleStatus: defaultLifecycleFor(asset),
    },
  }));
