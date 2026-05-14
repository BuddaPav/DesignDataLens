/**
 * Круглая миникарта (тайлы + игрок + NPC + метки), обновляется в rAF.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NPC, Weather } from '@/types/game';
import { TILE_PX } from '@/engine/worldTiles';
import { paintTacticalMap } from '@/engine/tacticalMapPaint';
import { loadNavigation, pruneExpiredPings, saveNavigation } from '@/lib/navigationStorage';

const VIEW_TILES = 26;

export interface NavigationMinimapProps {
  enabled: boolean;
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  /** CSS-фильтр для дальтонизма (из настроек), например hue-rotate */
  colorFilter?: string;
}

export function NavigationMinimap({
  enabled,
  worldSeed,
  playerTileX,
  playerTileY,
  timeHour,
  weather,
  npcs,
  colorFilter
}: NavigationMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [navTick, setNavTick] = useState(0);

  useEffect(() => {
    const fn = () => setNavTick((n) => n + 1);
    window.addEventListener('chronos:navigation_updated', fn);
    return () => window.removeEventListener('chronos:navigation_updated', fn);
  }, []);

  const paint = useCallback(() => {
    void navTick;
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tw = Math.floor(cw * dpr);
    const th = Math.floor(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pixelScale = cw / VIEW_TILES;
    const viewLeft = playerTileX * TILE_PX - (VIEW_TILES * TILE_PX) / 2;
    const viewTop = playerTileY * TILE_PX - (VIEW_TILES * TILE_PX) / 2;
    const n = loadNavigation();
    const pings = pruneExpiredPings(n.pings);
    if (pings.length !== n.pings.length) {
      saveNavigation({ ...n, pings });
    }
    paintTacticalMap({
      ctx,
      cw,
      ch,
      pixelScale,
      viewLeft,
      viewTop,
      worldSeed,
      timeHour,
      weather,
      npcs,
      playerTileX,
      playerTileY,
      waypoints: n.waypoints,
      pings,
      now: Date.now(),
      lite: true
    });
  }, [enabled, worldSeed, playerTileX, playerTileY, timeHour, weather, npcs, navTick]);

  useEffect(() => {
    if (!enabled) return;
    let r = 0;
    const loop = () => {
      paint();
      r = requestAnimationFrame(loop);
    };
    r = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(r);
  }, [enabled, paint]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed right-3 top-[4.5rem] z-[40] h-[132px] w-[132px] overflow-hidden rounded-full border border-cyan-400/35 bg-black/50 shadow-[0_0_24px_rgba(34,211,238,0.15)] sm:right-5 sm:top-[5rem] sm:h-[148px] sm:w-[148px]"
      style={colorFilter ? { filter: colorFilter } : undefined}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
