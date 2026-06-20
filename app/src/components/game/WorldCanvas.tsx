// Открытый мир на Canvas: биомы, сетка чанков 50×50, день/ночь, погода, NPC (круги, тень, эмоции).
// Игровой цикл на requestAnimationFrame без перезапуска при движении (refs).

import { useEffect, useRef, useState } from 'react';
import type { NPC, Weather } from '@/types/game';
import {
  TILE_PX,
  biomeAt,
  biomeColors,
  elevationAt,
  npcWorldTile,
  nearestLocationLabel,
  CHUNK_SIZE,
  tileHash01
} from '@/engine/worldTiles';
import { soundManager } from '@/engine/SoundManager';
import {
  tryLoadWorldAtlas,
  atlasFrameNameForBiome,
  resolveAtlasFrame,
  type WorldAtlasFrames
} from '@/engine/chronosAssets';
import { npcMarkerStrokeColor, npcMarkerGlowRGBA } from '@/engine/npcMarkerStyle';

interface WorldCanvasProps {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  onMove: (d: { dTileX: number; dTileY: number }) => void;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  onNpcClick: (npcId: string) => void;
}

function emotionEmoji(npc: NPC): string {
  const { stress, happiness, trauma } = npc.mentalState;
  if (trauma > 70) return '😰';
  if (stress > 80) return '😤';
  if (happiness < 25) return '😔';
  if (happiness > 75) return '😊';
  if (npc.playerRelationship.trust < -40) return '😠';
  if (npc.playerRelationship.affection > 50) return '💬';
  return '·';
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function npcAccentFromId(id: string): { light: string; mid: string; dark: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    light: `hsl(${hue}, 82%, 82%)`,
    mid: `hsl(${hue}, 68%, 52%)`,
    dark: `hsl(${hue}, 72%, 24%)`
  };
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ra = (pa >> 16) & 255,
    ga = (pa >> 8) & 255,
    ba = pa & 255;
  const rb = (pb >> 16) & 255,
    gb = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const bl = Math.round(ba + (bb - ba) * t);
  return `rgb(${r},${g},${bl})`;
}

export function WorldCanvas({
  worldSeed,
  playerTileX,
  playerTileY,
  onMove,
  timeHour,
  weather,
  npcs,
  onNpcClick
}: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastTsRef = useRef(0);
  const stepAccRef = useRef(0);
  const rainRef = useRef<Array<{ x: number; y: number; vy: number; len: number }>>([]);
  const snowRef = useRef<Array<{ x: number; y: number; vy: number; r: number }>>([]);
  const starsRef = useRef<Array<{ x: number; y: number; b: number }>>([]);
  const waterPhaseRef = useRef(0);
  const atlasRef = useRef<WorldAtlasFrames | null>(null);

  const worldRef = useRef({
    worldSeed,
    playerTileX,
    playerTileY,
    timeHour,
    weather,
    npcs,
    onMove,
    onNpcClick
  });
  worldRef.current = { worldSeed, playerTileX, playerTileY, timeHour, weather, npcs, onMove, onNpcClick };

  const [hud, setHud] = useState({ x: playerTileX, y: playerTileY, label: null as string | null });

  useEffect(() => {
    setHud({
      x: playerTileX,
      y: playerTileY,
      label: nearestLocationLabel(playerTileX, playerTileY)
    });
  }, [playerTileX, playerTileY]);

  useEffect(() => {
    void tryLoadWorldAtlas().then((a) => {
      atlasRef.current = a;
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const speed = 9;
    let raf = 0;

    let resizeRaf = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = Math.min(520, Math.max(280, Math.floor(window.innerHeight * 0.42)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const scheduleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    };
    resize();
    window.addEventListener('resize', scheduleResize);

    const onClick = (e: MouseEvent) => {
      const w = worldRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const viewLeft = w.playerTileX * TILE_PX - cw / 2;
      const viewTop = w.playerTileY * TILE_PX - ch / 2;
      for (const npc of w.npcs) {
        const p = npcWorldTile(npc);
        const sx = p.x * TILE_PX - viewLeft;
        const sy = p.y * TILE_PX - viewTop;
        const dx = mx - sx;
        const dy = my - sy;
        if (dx * dx + dy * dy < 28 * 28) {
          soundManager.play('dialogue');
          w.onNpcClick(npc.id);
          return;
        }
      }
    };
    canvas.addEventListener('click', onClick);

    const frame = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;
      const w = worldRef.current;

      const k = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (k['d'] || k['arrowright']) dx += 1;
      if (k['a'] || k['arrowleft']) dx -= 1;
      if (k['s'] || k['arrowdown']) dy += 1;
      if (k['w'] || k['arrowup']) dy -= 1;
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }
      if (dx !== 0 || dy !== 0) {
        w.onMove({ dTileX: dx * speed * dt, dTileY: dy * speed * dt });
        stepAccRef.current += dt;
        if (stepAccRef.current > 0.4) {
          stepAccRef.current = 0;
        }
      } else {
        stepAccRef.current = 0;
      }

      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw < 10 || ch < 10) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const ptX = w.playerTileX;
      const ptY = w.playerTileY;
      const seed = w.worldSeed;
      const th = w.timeHour;
      const wx = w.weather;
      waterPhaseRef.current += dt * 1.15;
      const wphase = waterPhaseRef.current;

      if (rainRef.current.length === 0) {
        for (let i = 0; i < 220; i++) {
          rainRef.current.push({
            x: Math.random() * cw,
            y: Math.random() * ch,
            vy: 12 + Math.random() * 18,
            len: 8 + Math.random() * 14
          });
        }
      }
      if (snowRef.current.length === 0) {
        for (let i = 0; i < 160; i++) {
          snowRef.current.push({
            x: Math.random() * cw,
            y: Math.random() * ch,
            vy: 0.8 + Math.random() * 1.8,
            r: 1 + Math.random() * 2
          });
        }
      }
      if (starsRef.current.length === 0) {
        for (let i = 0; i < 90; i++) {
          starsRef.current.push({
            x: Math.random() * cw,
            y: Math.random() * ch * 0.55,
            b: 0.2 + Math.random() * 0.8
          });
        }
      }

      const viewLeft = ptX * TILE_PX - cw / 2;
      const viewTop = ptY * TILE_PX - ch / 2;

      ctx.fillStyle = '#0B0C10';
      ctx.fillRect(0, 0, cw, ch);

      const cols = Math.ceil(cw / TILE_PX) + 3;
      const rows = Math.ceil(ch / TILE_PX) + 3;
      const startTileX = Math.floor(viewLeft / TILE_PX);
      const startTileY = Math.floor(viewTop / TILE_PX);
      const ox = -(viewLeft - startTileX * TILE_PX);
      const oy = -(viewTop - startTileY * TILE_PX);

      const atlas = atlasRef.current;

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const tix = startTileX + i;
          const tiy = startTileY + j;
          const biome = biomeAt(tix, tiy, seed);
          const px = ox + i * TILE_PX;
          const py = oy + j * TILE_PX;
          let drewAtlas = false;
          if (atlas) {
            const fname = atlasFrameNameForBiome(biome, tix, tiy, seed);
            let fr = resolveAtlasFrame(atlas, fname);
            if (!fr) fr = resolveAtlasFrame(atlas, `biome_${biome}_var01`);
            if (fr) {
              ctx.drawImage(atlas.image, fr.x, fr.y, fr.w, fr.h, px, py, TILE_PX + 0.6, TILE_PX + 0.6);
              drewAtlas = true;
            }
          }
          if (!drewAtlas) {
            const col = biomeColors(biome);
            const mid = mixHex(
              col.top,
              col.bottom,
              0.45 + (tileHash01(tix, tiy, seed) - 0.5) * 0.08
            );
            const g = ctx.createLinearGradient(px, py, px, py + TILE_PX);
            g.addColorStop(0, col.top + 'cc');
            g.addColorStop(1, col.bottom + 'ee');
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TILE_PX + 0.6, TILE_PX + 0.6);
            ctx.fillStyle = mid + '33';
            ctx.fillRect(px, py, TILE_PX + 0.6, 2);
          }

          if (biome !== 'deep_water' && biome !== 'shallow') {
            const elev = elevationAt(tix, tiy, seed);
            const ridge = Math.max(0, elev - 0.35);
            const cliff = Math.max(0, elev - 0.62);
            const relief = Math.min(TILE_PX * 0.6, ridge * TILE_PX * 2.4 + cliff * TILE_PX * 2.1);
            if (relief > 0.02) {
              ctx.fillStyle = `rgba(255,255,255,${Math.min(0.18, 0.04 + relief * 0.045)})`;
              ctx.fillRect(px + 0.8, py + 0.8, TILE_PX - 1.4, Math.max(1, relief * 0.42));
              ctx.fillStyle = `rgba(8,10,16,${Math.min(0.34, 0.08 + relief * 0.08)})`;
              ctx.fillRect(
                px + 0.8,
                py + TILE_PX - Math.max(1, relief * 0.62),
                TILE_PX - 1.4,
                Math.max(1, relief * 0.62)
              );
            }
            if (elev > 0.5) {
              const contourBand = Math.floor(elev * 38);
              if ((contourBand + tix + tiy) % 7 === 0) {
                ctx.strokeStyle = `rgba(240,244,255,${0.06 + Math.min(0.09, (elev - 0.5) * 0.2)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px + 1.2, py + TILE_PX * 0.62);
                ctx.lineTo(px + TILE_PX - 1.2, py + TILE_PX * 0.35);
                ctx.stroke();
              }
            }
          }

          if (biome === 'deep_water' || biome === 'shallow') {
            const wave =
              Math.sin(tix * 0.11 + tiy * 0.09 + wphase * 2.4) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(130,210,255,${0.06 + wave * 0.1})`;
            ctx.fillRect(px, py, TILE_PX + 0.6, TILE_PX + 0.6);
            if (atlas) {
              const wf = 1 + (Math.floor(wphase * 3.2 + tix * 0.02 + tiy * 0.02) % 4);
              const pad = wf < 10 ? `0${wf}` : String(wf);
              const fr = resolveAtlasFrame(atlas, `overlay_water_wave_${pad}`);
              if (fr) {
                ctx.save();
                ctx.globalAlpha = 0.42;
                ctx.drawImage(
                  atlas.image,
                  fr.x,
                  fr.y,
                  fr.w,
                  fr.h,
                  px,
                  py,
                  TILE_PX + 0.6,
                  TILE_PX + 0.6
                );
                ctx.restore();
              }
            }
          }
          if (biome === 'forest' && tileHash01(tix, tiy, seed + 3) > 0.68) {
            const frTree = atlas ? resolveAtlasFrame(atlas, 'overlay_tree_canopy_01') : null;
            if (frTree && atlas) {
              ctx.save();
              ctx.globalAlpha = 0.58;
              ctx.drawImage(
                atlas.image,
                frTree.x,
                frTree.y,
                frTree.w,
                frTree.h,
                px,
                py,
                TILE_PX + 0.6,
                TILE_PX + 0.6
              );
              ctx.restore();
            } else {
              const g = 0.35 + tileHash01(tix, tiy, seed) * 0.25;
              ctx.fillStyle = `rgba(40,120,70,${g})`;
              ctx.beginPath();
              ctx.moveTo(px + TILE_PX * 0.5, py + 2);
              ctx.lineTo(px + TILE_PX * 0.85, py + TILE_PX * 0.88);
              ctx.lineTo(px + TILE_PX * 0.15, py + TILE_PX * 0.88);
              ctx.closePath();
              ctx.fill();
            }
          }
          if (biome === 'plains' && tileHash01(tix, tiy, seed + 11) > 0.82) {
            ctx.strokeStyle = `rgba(90,160,80,${0.25 + tileHash01(tix, tiy, seed) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 2, py + TILE_PX - 2);
            ctx.lineTo(px + 3, py + TILE_PX * 0.45);
            ctx.stroke();
          }
          if ((biome === 'mountain' || biome === 'hills') && tileHash01(tix, tiy, seed + 31) > 0.88 && atlas) {
            const fr = resolveAtlasFrame(atlas, 'overlay_rock_mountain_01');
            if (fr) {
              ctx.save();
              ctx.globalAlpha = 0.65;
              ctx.drawImage(
                atlas.image,
                fr.x,
                fr.y,
                fr.w,
                fr.h,
                px,
                py,
                TILE_PX + 0.6,
                TILE_PX + 0.6
              );
              ctx.restore();
            }
          }
          if (biome === 'beach') {
            const n = [biomeAt(tix - 1, tiy, seed), biomeAt(tix + 1, tiy, seed), biomeAt(tix, tiy - 1, seed), biomeAt(tix, tiy + 1, seed)];
            const nearWater = n.some((b) => b === 'shallow' || b === 'deep_water');
            if (nearWater) {
              ctx.strokeStyle = 'rgba(255,250,240,0.35)';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);
            }
          }
        }
      }

      if (th >= 8 && th <= 16 && wx !== 'stormy') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(255, 238, 204, 0.26)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
      if (th >= 17 && th < 20) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(255, 153, 85, 0.2)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        const wx = startTileX + x;
        if (wx % CHUNK_SIZE === 0) {
          ctx.beginPath();
          ctx.moveTo(ox + x * TILE_PX, 0);
          ctx.lineTo(ox + x * TILE_PX, ch);
          ctx.stroke();
        }
      }
      for (let y = 0; y <= rows; y++) {
        const wy = startTileY + y;
        if (wy % CHUNK_SIZE === 0) {
          ctx.beginPath();
          ctx.moveTo(0, oy + y * TILE_PX);
          ctx.lineTo(cw, oy + y * TILE_PX);
          ctx.stroke();
        }
      }

      // «Планетарная» сетка: лёгкий рельеф + гекс + сканер (NMS-подобная карта)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = ox + i * TILE_PX;
          const py = oy + j * TILE_PX;
          const tix = startTileX + i;
          const tiy = startTileY + j;
          const biome = biomeAt(tix, tiy, seed);
          if (biome === 'deep_water' || biome === 'shallow') continue;
          const h = tileHash01(tix, tiy, seed + 501);
          ctx.fillStyle = `rgba(255,255,255,${0.03 + h * 0.04})`;
          ctx.fillRect(px + 1, py + 1, TILE_PX * 0.35, TILE_PX * 0.4);
          ctx.fillStyle = `rgba(0,0,0,${0.04 + h * 0.03})`;
          ctx.fillRect(px + TILE_PX * 0.55, py + TILE_PX * 0.45, TILE_PX * 0.42, TILE_PX * 0.48);
        }
      }
      ctx.strokeStyle = 'rgba(103,232,249,0.04)';
      ctx.lineWidth = 1;
      for (let j = 0; j < rows; j += 2) {
        for (let i = 0; i < cols; i += 2) {
          const px = ox + i * TILE_PX;
          const py = oy + j * TILE_PX;
          const cx = px + TILE_PX / 2;
          const cy = py + TILE_PX / 2;
          const r = TILE_PX * 0.46;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 - Math.PI / 6;
            const qx = cx + Math.cos(a) * r;
            const qy = cy + Math.sin(a) * r * 0.9;
            if (k === 0) ctx.moveTo(qx, qy);
            else ctx.lineTo(qx, qy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      const sweepPhase = (ts * 0.00026) % (Math.PI * 2);
      const sx0 = cw * 0.5 + Math.cos(sweepPhase) * cw * 0.62;
      const sy0 = ch * 0.42 + Math.sin(sweepPhase * 0.65) * ch * 0.28;
      const scan = ctx.createLinearGradient(sx0 - cw * 1.2, sy0 - ch, sx0 + cw * 1.2, sy0 + ch);
      scan.addColorStop(0, 'rgba(45,212,191,0)');
      scan.addColorStop(0.45, 'rgba(34,211,238,0.04)');
      scan.addColorStop(0.5, 'rgba(165,243,252,0.09)');
      scan.addColorStop(0.55, 'rgba(34,211,238,0.04)');
      scan.addColorStop(1, 'rgba(45,212,191,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = scan;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();

      for (const npc of w.npcs) {
        const p = npcWorldTile(npc);
        const sx = p.x * TILE_PX - viewLeft;
        const sy = p.y * TILE_PX - viewTop;
        if (sx < -40 || sy < -40 || sx > cw + 40 || sy > ch + 40) continue;

        const strokeCol = npcMarkerStrokeColor(npc);
        const glow = npcMarkerGlowRGBA(npc);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 14, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const accent = npcAccentFromId(npc.id);
        const grd = ctx.createRadialGradient(sx - 6, sy - 6, 2, sx, sy, 22);
        grd.addColorStop(0, accent.light);
        grd.addColorStop(0.45, accent.mid);
        grd.addColorStop(1, accent.dark);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#faf5ff';
        ctx.font = 'bold 11px system-ui,Segoe UI,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials(npc.name), sx, sy + 1);
        ctx.font = '14px serif';
        ctx.fillText(emotionEmoji(npc), sx + 18, sy - 16);
      }

      const cx = cw / 2;
      const cy = ch / 2;
      const pg = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, 26);
      pg.addColorStop(0, '#fef3c7');
      pg.addColorStop(0.5, '#f59e0b');
      pg.addColorStop(1, '#b45309');
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();

      let night = 0;
      if (th >= 21 || th < 5) night = 0.62;
      else if (th >= 19) night = 0.35 + (th - 19) * 0.135;
      else if (th < 7) night = 0.45 - th * 0.06;

      if (night > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(42, 58, 90, ${night * 0.55})`;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
        if (starsRef.current.length && (th >= 20 || th < 6)) {
          for (const st of starsRef.current) {
            ctx.fillStyle = `rgba(255,255,255,${st.b * night})`;
            ctx.fillRect(st.x, st.y, 1.5, 1.5);
          }
        }
        ctx.fillStyle = `rgba(8, 12, 40, ${night * 0.45})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      if (wx === 'rainy' || wx === 'stormy') {
        ctx.strokeStyle = wx === 'stormy' ? 'rgba(180,200,255,0.38)' : 'rgba(200,220,255,0.24)';
        ctx.lineWidth = 1;
        for (const drop of rainRef.current) {
          drop.y += drop.vy * dt * 60 * 0.35;
          drop.x += 20 * dt;
          if (drop.y > ch) {
            drop.y = -10;
            drop.x = Math.random() * cw;
          }
          if (drop.x > cw) drop.x = 0;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 4, drop.y + drop.len);
          ctx.stroke();
        }
        if (wx === 'stormy') {
          ctx.fillStyle = 'rgba(15,20,40,0.22)';
          ctx.fillRect(0, 0, cw, ch);
        }
      }
      if (wx === 'snowy') {
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        for (const s of snowRef.current) {
          s.y += s.vy * dt * 40;
          s.x += Math.sin(s.y * 0.02) * 0.6;
          if (s.y > ch) {
            s.y = -4;
            s.x = Math.random() * cw;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (wx === 'foggy') {
        const fg = ctx.createRadialGradient(cw * 0.5, ch * 0.6, 20, cw * 0.5, ch * 0.5, cw * 0.85);
        fg.addColorStop(0, 'rgba(220,230,240,0.1)');
        fg.addColorStop(1, 'rgba(200,210,230,0.36)');
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, cw, ch);
      }

      // Солнечный объёмный свет (день) + виньетка — без внешних ассетов
      if (th >= 7 && th <= 17 && wx !== 'stormy') {
        const sunT = (th - 7) / 10;
        const sunX = cw * (0.62 + sunT * 0.22);
        const sunY = ch * (0.06 + sunT * 0.14);
        const sunG = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, Math.max(cw, ch) * 0.55);
        sunG.addColorStop(0, 'rgba(255,252,235,0.28)');
        sunG.addColorStop(0.12, 'rgba(255,220,160,0.12)');
        sunG.addColorStop(0.35, 'rgba(255,180,100,0.04)');
        sunG.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = sunG;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = 'source-over';
      }

      const cxV = cw / 2;
      const cyV = ch / 2;
      const vig = ctx.createRadialGradient(cxV, cyV, ch * 0.2, cxV, cyV, ch * 0.82);
      vig.addColorStop(0, 'rgba(11,12,16,0)');
      vig.addColorStop(0.55, 'rgba(11,12,16,0.35)');
      vig.addColorStop(1, 'rgba(11,12,16,0.78)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, cw, ch);

      const mm = 72;
      const pad = 10;
      const mx0 = cw - mm - pad;
      const my0 = ch - mm - pad;
      ctx.fillStyle = 'rgba(2,6,18,0.82)';
      ctx.strokeStyle = 'rgba(139,92,246,0.45)';
      ctx.lineWidth = 1;
      ctx.fillRect(mx0 - 2, my0 - 2, mm + 4, mm + 4);
      ctx.strokeRect(mx0 - 2, my0 - 2, mm + 4, mm + 4);
      const mcells = 9;
      const cs = mm / mcells;
      const ptx = Math.floor(ptX);
      const pty = Math.floor(ptY);
      for (let mj = 0; mj < mcells; mj++) {
        for (let mi = 0; mi < mcells; mi++) {
          const mtx = ptx + mi - Math.floor(mcells / 2);
          const mty = pty + mj - Math.floor(mcells / 2);
          const mb = biomeAt(mtx, mty, seed);
          const mc = biomeColors(mb);
          ctx.fillStyle = mixHex(mc.top, mc.bottom, 0.5);
          ctx.fillRect(mx0 + mi * cs, my0 + mj * cs, cs + 0.3, cs + 0.3);
        }
      }
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(mx0 + (mcells / 2 - 0.5) * cs - 1, my0 + (mcells / 2 - 0.5) * cs - 1, 4, 4);
      ctx.font = '10px system-ui,sans-serif';
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText('⌖', mx0 + mm - 14, my0 - 6);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', scheduleResize);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-violet-500/30 shadow-[0_0_80px_-12px_rgba(139,92,246,0.5)] bg-slate-950 ring-1 ring-white/5">
      <canvas ref={canvasRef} className="w-full block cursor-crosshair touch-none select-none" aria-label="Карта мира" />
      <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1 text-[11px] text-slate-200/95 font-mono bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-lg">
        <span>
          {Math.floor(hud.x).toLocaleString('ru-RU')} · {Math.floor(hud.y).toLocaleString('ru-RU')}
        </span>
        {hud.label && <span className="text-violet-300">◎ {hud.label}</span>}
        <span className="text-slate-500 text-[10px]">WASD · клик по NPC</span>
      </div>
    </div>
  );
}
