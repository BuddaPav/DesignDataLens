/**
 * Общая отрисовка тактической 2D-карты (биомы, сетка, игрок, NPC, метки).
 * Используется полноэкранной картой и миникартой.
 */
import type { NPC, Weather } from '@/types/game';
import { TILE_PX, biomeAt, biomeColors, npcWorldTile, CHUNK_SIZE } from '@/engine/worldTiles';
import type { NavPing, NavWaypoint } from '@/lib/navigationStorage';

export type TacticalPaintParams = {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  /** Размер одного тайла на канвасе (обычно TILE_PX; для зума < 1 уменьшать) */
  pixelScale: number;
  /** Левый верх экрана в пикселях мира (тайл * TILE_PX) */
  viewLeft: number;
  viewTop: number;
  worldSeed: number;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  playerTileX: number;
  playerTileY: number;
  waypoints: NavWaypoint[];
  pings: NavPing[];
  now: number;
  /** Упрощённая отрисовка (миникарта) */
  lite?: boolean;
  /** Маркеры угроз коалиций (тактическая карта). */
  coalitionPins?: Array<{ tileX: number; tileY: number }>;
};

/**
 * Рисует один кадр тактической карты в заданном viewport (viewLeft/viewTop — мировые px).
 * Не трогает CTM: вызывающий задаёт DPR (`setTransform(dpr,…)`) и при необходимости зум (`scale`).
 */
export function paintTacticalMap(p: TacticalPaintParams): void {
  const {
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
    waypoints,
    pings,
    now,
    lite,
    coalitionPins,
  } = p;

  const seed = worldSeed;
  const th = timeHour;
  const wx = weather;

  ctx.fillStyle = '#0B0C10';
  ctx.fillRect(0, 0, cw, ch);

  const cols = Math.ceil(cw / pixelScale) + 2;
  const rows = Math.ceil(ch / pixelScale) + 2;
  const startTileX = Math.floor(viewLeft / TILE_PX);
  const startTileY = Math.floor(viewTop / TILE_PX);
  const ox = -(viewLeft - startTileX * TILE_PX) * (pixelScale / TILE_PX);
  const oy = -(viewTop - startTileY * TILE_PX) * (pixelScale / TILE_PX);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tix = startTileX + i;
      const tiy = startTileY + j;
      const biome = biomeAt(tix, tiy, seed);
      const px = ox + i * pixelScale;
      const py = oy + j * pixelScale;
      const col = biomeColors(biome);
      const g = ctx.createLinearGradient(px, py, px, py + pixelScale);
      g.addColorStop(0, col.top + (lite ? 'ee' : 'cc'));
      g.addColorStop(1, col.bottom + (lite ? 'ee' : 'ee'));
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pixelScale + 0.5, pixelScale + 0.5);
      if (!lite && (biome === 'deep_water' || biome === 'shallow')) {
        const wave = Math.sin(tix * 0.11 + tiy * 0.09) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(130,210,255,${0.05 + wave * 0.08})`;
        ctx.fillRect(px, py, pixelScale + 0.5, pixelScale + 0.5);
      }
    }
  }

  if (!lite) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      const wxv = startTileX + x;
      if (wxv % CHUNK_SIZE === 0) {
        ctx.beginPath();
        ctx.moveTo(ox + x * pixelScale, 0);
        ctx.lineTo(ox + x * pixelScale, ch);
        ctx.stroke();
      }
    }
    for (let y = 0; y <= rows; y++) {
      const wy = startTileY + y;
      if (wy % CHUNK_SIZE === 0) {
        ctx.beginPath();
        ctx.moveTo(0, oy + y * pixelScale);
        ctx.lineTo(cw, oy + y * pixelScale);
        ctx.stroke();
      }
    }
  }

  const ps = pixelScale / TILE_PX;
  for (const w of waypoints) {
    const sx = (w.tileX * TILE_PX - viewLeft) * ps;
    const sy = (w.tileY * TILE_PX - viewTop) * ps;
    if (sx < -20 || sy < -20 || sx > cw + 20 || sy > ch + 20) continue;
    ctx.save();
    ctx.strokeStyle = w.color;
    ctx.fillStyle = w.color + '44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 === 0 ? 9 : 4;
      const qx = sx + Math.cos(a) * r;
      const qy = sy + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(qx, qy);
      else ctx.lineTo(qx, qy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  for (const ping of pings) {
    if (ping.until <= now) continue;
    const sx = (ping.tileX * TILE_PX - viewLeft) * ps;
    const sy = (ping.tileY * TILE_PX - viewTop) * ps;
    const t = (ping.until - now) / 3000;
    const alpha = Math.min(1, t) * 0.55;
    ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 14 + (1 - t) * 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const npc of npcs) {
    const pos = npcWorldTile(npc);
    const sx = (pos.x * TILE_PX - viewLeft) * ps;
    const sy = (pos.y * TILE_PX - viewTop) * ps;
    if (sx < -30 || sy < -30 || sx > cw + 30 || sy > ch + 30) continue;
    ctx.fillStyle = 'rgba(139,92,246,0.45)';
    ctx.beginPath();
    ctx.arc(sx, sy, lite ? 5 : 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,181,253,0.9)';
    ctx.lineWidth = lite ? 1 : 1.5;
    ctx.stroke();
  }

  if (!lite && coalitionPins && coalitionPins.length > 0) {
    for (const pin of coalitionPins) {
      const sx = (pin.tileX * TILE_PX - viewLeft) * ps;
      const sy = (pin.tileY * TILE_PX - viewTop) * ps;
      if (sx < -40 || sy < -40 || sx > cw + 40 || sy > ch + 40) continue;
      ctx.save();
      ctx.strokeStyle = 'rgba(251,113,133,0.95)';
      ctx.fillStyle = 'rgba(225,29,72,0.38)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(254,205,211,0.95)';
      ctx.font = 'bold 13px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', sx, sy);
      ctx.restore();
    }
  }

  const px = (playerTileX * TILE_PX - viewLeft) * ps;
  const py = (playerTileY * TILE_PX - viewTop) * ps;
  const pr = lite ? 5 : 12;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(px, py - pr * 1.4);
  ctx.lineTo(px + pr, py + pr * 0.85);
  ctx.lineTo(px - pr, py + pr * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  let night = 0;
  if (th >= 21 || th < 5) night = 0.45;
  else if (th >= 19) night = 0.22 + (th - 19) * 0.1;
  if (night > 0.04 && !lite) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(42, 58, 90, ${night * 0.5})`;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }
  if ((wx === 'foggy' || wx === 'mystical') && !lite) {
    ctx.fillStyle = 'rgba(200,210,230,0.12)';
    ctx.fillRect(0, 0, cw, ch);
  }
}
