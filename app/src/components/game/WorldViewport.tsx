/**
 * Обёртка для ленивой загрузки тяжёлого 3D-слоя (отдельный Vite-чанк).
 */
import { useState } from 'react';
import type { NPC, Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import type { NavPing } from '@/lib/navigationStorage';
import { WorldCanvas } from '@/components/game/WorldCanvas';
import { World3DErrorBoundary, WorldScene3DCanvas, type SpatialNpcLine } from '@/components/game/WorldScene3D';
import { Button } from '@/components/ui/button';

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
  const [worldRetryNonce, setWorldRetryNonce] = useState(0);
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

  const fallback = (
    <div className="space-y-3">
      <WorldCanvas {...canvas2dProps} />
      <div className="flex items-center justify-end">
        <Button size="sm" variant="secondary" onClick={() => setWorldRetryNonce((v) => v + 1)}>
          Retry 3D
        </Button>
      </div>
    </div>
  );

  return (
    <World3DErrorBoundary key={worldRetryNonce} fallback={fallback}>
      <WorldScene3DCanvas key={worldRetryNonce} {...scene3dProps} />
    </World3DErrorBoundary>
  );
}
