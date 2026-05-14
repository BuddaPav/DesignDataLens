/**
 * Обёртка для ленивой загрузки тяжёлого 3D-слоя (отдельный Vite-чанк).
 */
import type { NPC, Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import type { NavPing } from '@/lib/navigationStorage';
import { WorldCanvas } from '@/components/game/WorldCanvas';
import { World3DErrorBoundary, WorldScene3DCanvas, type SpatialNpcLine } from '@/components/game/WorldScene3D';

export interface WorldViewportProps {
  hqWorld: boolean;
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  onMove: (d: { dTileX: number; dTileY: number }) => void;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  onNpcClick: (npcId: string) => void;
  worldEra?: WorldEra;
  spatialNpcLines?: SpatialNpcLine[];
  worldPings?: NavPing[];
  graphicsTier?: WorldGraphicsTier;
}

export function WorldViewport(props: WorldViewportProps) {
  const { hqWorld, spatialNpcLines, worldPings, graphicsTier, ...rest } = props;
  const canvas2dProps = {
    worldSeed: rest.worldSeed,
    playerTileX: rest.playerTileX,
    playerTileY: rest.playerTileY,
    onMove: rest.onMove,
    timeHour: rest.timeHour,
    weather: rest.weather,
    npcs: rest.npcs,
    onNpcClick: rest.onNpcClick
  };
  const scene3dProps = {
    ...canvas2dProps,
    worldEra: rest.worldEra,
    spatialNpcLines,
    worldPings,
    graphicsTier
  };

  if (!hqWorld) {
    return <WorldCanvas {...canvas2dProps} />;
  }

  return (
    <World3DErrorBoundary fallback={<WorldCanvas {...canvas2dProps} />}>
      <WorldScene3DCanvas {...scene3dProps} />
    </World3DErrorBoundary>
  );
}
