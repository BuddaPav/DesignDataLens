export type ProductionAssetType =
  | 'character'
  | 'environment'
  | 'prop'
  | 'vfx'
  | 'audio'
  | 'ui';

export type ProductionAssetTier = 'hero' | 'mid' | 'background';

export type ProductionAssetSource = 'internal' | 'outsource' | 'marketplace';

export type ProductionAssetStatus =
  | 'blockout'
  | 'review'
  | 'approved'
  | 'integrated'
  | 'deprecated';

export interface ProductionAssetContract {
  assetId: string;
  assetType: ProductionAssetType;
  tier: ProductionAssetTier;
  owner: string;
  source: ProductionAssetSource;
  license: string;
  lodCount: number;
  hasCollision: boolean;
  skeletonProfile: string | null;
  localeCoverage: string[];
  status: ProductionAssetStatus;
}
