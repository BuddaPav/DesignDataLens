import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import type { QualityAssetId } from '@/domain/assets/chronosMassModelCatalog';
import { OptionalLocalGlb } from '@/rendering/OptionalLocalGlb';
import {
  CHRONOS_MASS_MODEL_COUNT,
  chronosMassModelLodSet,
  chronosQualityModelLodSet,
} from '@/domain/assets/chronosMassModelCatalog';
import { biomeAt, elevationAt, tileHash01 } from '@/engine/worldTiles';

const HEIGHT_SCALE = 16;
const SLOT_COUNTS: Record<WorldGraphicsTier, number> = {
  low: 12,
  balanced: 22,
  high: 34,
};

const LANDMARK_COUNTS: Record<WorldGraphicsTier, number> = {
  low: 2,
  balanced: 4,
  high: 6,
};

type MassGeneratedPropsProps = {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  graphicsTier: WorldGraphicsTier;
};

// Quality models by biome (real geometry, not triangle soup)
const QUALITY_ASSETS_BY_BIOME: Record<string, QualityAssetId[]> = {
  forest: ['tree_pine', 'tree_oak', 'tree_dead', 'rock_large', 'stump', 'mushroom'],
  swamp: ['tree_dead', 'tree_oak', 'mushroom', 'boulder', 'rock_small'],
  mountain: ['rock_large', 'rock_small', 'crystal_blue', 'crystal_purple', 'crystal_green'],
  desert: ['rock_large', 'rock_small', 'boulder'],
  default: ['barrel', 'crate', 'campfire', 'lantern', 'signpost'],
};

function getQualityAssetForBiome(biome: string, hash: number): QualityAssetId | null {
  const assets = QUALITY_ASSETS_BY_BIOME[biome] || QUALITY_ASSETS_BY_BIOME.default;
  if (!assets || assets.length === 0) return null;
  const index = Math.floor(hash * assets.length);
  return assets[index] || assets[0];
}

function modelIndexForTile(tileX: number, tileY: number, worldSeed: number): number {
  const biome = biomeAt(tileX, tileY, worldSeed);
  const hash = tileHash01(tileX, tileY, worldSeed + 91337);
  const band =
    biome === 'deep_water' || biome === 'shallow'
      ? 0
      : biome === 'forest'
        ? 1
        : biome === 'hills' || biome === 'ruins'
          ? 2
          : biome === 'mountain' || biome === 'snow'
            ? 3
            : biome === 'desert' || biome === 'beach'
              ? 4
              : 5;
  const bandSize = Math.floor(CHRONOS_MASS_MODEL_COUNT / 6);
  const start = band * bandSize;
  const maxRange = band === 5 ? CHRONOS_MASS_MODEL_COUNT - start : bandSize;
  const indexInBand = Math.max(0, Math.min(maxRange - 1, Math.floor(hash * maxRange)));
  return Math.max(1, Math.min(CHRONOS_MASS_MODEL_COUNT, start + indexInBand + 1));
}

export function MassGeneratedProps({
  worldSeed,
  playerTileX,
  playerTileY,
  graphicsTier,
}: MassGeneratedPropsProps) {
  const ambientSlots = SLOT_COUNTS[graphicsTier];
  const landmarkSlots = LANDMARK_COUNTS[graphicsTier];
  const radius = graphicsTier === 'high' ? 30 : graphicsTier === 'balanced' ? 24 : 19;
  const landmarkRadius = radius + 16;

  const ambientEntries = Array.from({ length: ambientSlots }, (_, idx) => {
    const h1 = tileHash01(idx + 1, Math.floor(playerTileX), worldSeed + 12001);
    const h2 = tileHash01(idx + 1, Math.floor(playerTileY), worldSeed + 12079);
    const h3 = tileHash01(idx + 1, worldSeed, worldSeed + 12137);

    const tileX = Math.floor(playerTileX + (h1 - 0.5) * radius * 2);
    const tileY = Math.floor(playerTileY + (h2 - 0.5) * radius * 2);
    const biome = biomeAt(tileX, tileY, worldSeed);
    if (biome === 'deep_water' || biome === 'shallow') return null;

    // Distance check - use quality models for closer props, bulk for distant
    const distToPlayer = Math.sqrt(
      Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2)
    );
    const useQuality = distToPlayer < 12; // Within 12 tiles use quality models

    let lodPaths: [string, string, string];
    let scale: number;

    if (useQuality) {
      // Try to get quality model for this biome
      const qualityAsset = getQualityAssetForBiome(biome, h3);
      if (qualityAsset) {
        lodPaths = chronosQualityModelLodSet(qualityAsset);
        scale = 0.5 + h3 * 0.5;
      } else {
        // Fallback to bulk
        const modelIndex = modelIndexForTile(tileX, tileY, worldSeed);
        lodPaths = chronosMassModelLodSet(modelIndex);
        scale = 0.24 + h3 * 0.4;
      }
    } else {
      // Distant - use bulk models
      const modelIndex = modelIndexForTile(tileX, tileY, worldSeed);
      lodPaths = chronosMassModelLodSet(modelIndex);
      scale = 0.24 + h3 * 0.4;
    }

    const y = elevationAt(tileX + 0.5, tileY + 0.5, worldSeed) * HEIGHT_SCALE + 0.08;

    return {
      key: `${tileX}_${tileY}_ambient_${idx}`,
      lodPaths,
      position: [tileX + 0.5, y, tileY + 0.5] as [number, number, number],
      rotation: [0, h2 * Math.PI * 2, 0] as [number, number, number],
      scale,
      maxDistance: 36,
    };
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  const landmarkEntries = Array.from({ length: landmarkSlots }, (_, idx) => {
    const h1 = tileHash01(idx + 101, Math.floor(playerTileX / 2), worldSeed + 22101);
    const h2 = tileHash01(idx + 101, Math.floor(playerTileY / 2), worldSeed + 22187);
    const h3 = tileHash01(idx + 101, worldSeed, worldSeed + 22271);

    const tileX = Math.floor(playerTileX + (h1 - 0.5) * landmarkRadius * 2);
    const tileY = Math.floor(playerTileY + (h2 - 0.5) * landmarkRadius * 2);
    const biome = biomeAt(tileX, tileY, worldSeed);
    if (biome === 'deep_water' || biome === 'shallow') return null;

    // Landmarks always use quality when close
    const distToPlayer = Math.sqrt(
      Math.pow(tileX - playerTileX, 2) + Math.pow(tileY - playerTileY, 2)
    );
    const useQuality = distToPlayer < 20;

    let lodPaths: [string, string, string];
    let scale: number;

    if (useQuality) {
      const qualityAsset = getQualityAssetForBiome(biome, h1);
      if (qualityAsset) {
        lodPaths = chronosQualityModelLodSet(qualityAsset);
        scale = 0.7 + h3 * 1.2;
      } else {
        const modelIndex = modelIndexForTile(tileX * 3, tileY * 5, worldSeed);
        lodPaths = chronosMassModelLodSet(modelIndex);
        scale = 0.7 + h3 * 1.2;
      }
    } else {
      const modelIndex = modelIndexForTile(tileX * 3, tileY * 5, worldSeed);
      lodPaths = chronosMassModelLodSet(modelIndex);
      scale = 0.7 + h3 * 1.2;
    }

    const y = elevationAt(tileX + 0.5, tileY + 0.5, worldSeed) * HEIGHT_SCALE + 0.04;

    return {
      key: `landmark_${tileX}_${tileY}_${idx}`,
      lodPaths,
      position: [tileX + 0.5, y, tileY + 0.5] as [number, number, number],
      rotation: [0, h1 * Math.PI * 2, 0] as [number, number, number],
      scale,
      maxDistance: 56,
    };
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  const entries = [...ambientEntries, ...landmarkEntries];

  return (
    <group>
      {entries.map((entry) => (
        <OptionalLocalGlb
          key={entry.key}
          path={entry.lodPaths[0]}
          lodPaths={entry.lodPaths}
          position={entry.position}
          rotation={entry.rotation}
          scale={entry.scale}
          maxDistance={entry.maxDistance}
          minTier="low"
          graphicsTier={graphicsTier}
        />
      ))}
    </group>
  );
}
