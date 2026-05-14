/**
 * Верхняя полоса-компас: стороны света + маркер ближайшей цели (NPC в мире).
 */
import { useMemo } from 'react';
import type { NPC } from '@/types/game';
import { npcWorldTile } from '@/engine/worldTiles';
import { getLanguage, t } from '@/i18n';

export interface NavigationCompassBarProps {
  playerTileX: number;
  playerTileY: number;
  npcs: NPC[];
}

export function NavigationCompassBar({ playerTileX, playerTileY, npcs }: NavigationCompassBarProps) {
  const lang = getLanguage();

  const marker = useMemo(() => {
    if (!npcs.length) return null;
    let best: { id: string; ang: number; d: number } | null = null;
    for (const n of npcs) {
      const p = npcWorldTile(n);
      const dx = p.x - playerTileX;
      const dy = p.y - playerTileY;
      const d = Math.hypot(dx, dy);
      if (d < 0.4) continue;
      const ang = Math.atan2(dx, -dy);
      if (!best || d < best.d) best = { id: n.id, ang, d };
    }
    if (!best) return null;
    const xPct = 50 + 44 * Math.sin(best.ang);
    return { xPct, dist: best.d };
  }, [npcs, playerTileX, playerTileY]);

  return (
    <div className="pointer-events-none fixed left-1/2 top-[3.75rem] z-[38] w-[min(92vw,520px)] -translate-x-1/2 sm:top-[4.25rem]">
      <div
        className="relative mx-auto rounded-full border border-cyan-500/25 bg-black/45 px-6 py-1.5 backdrop-blur-md"
        title={t('nav.compass_hint', lang)}
      >
        <div className="flex justify-between text-[9px] font-mono font-semibold uppercase tracking-[0.28em] text-cyan-200/85">
          <span className="w-6 text-center text-slate-500">W</span>
          <span className="w-6 text-center">N</span>
          <span className="w-6 text-center text-slate-500">E</span>
        </div>
        <div className="relative mx-auto mt-0.5 h-1.5 w-[88%] rounded-full bg-gradient-to-r from-slate-800 via-cyan-950/80 to-slate-800">
          {marker && (
            <div
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-amber-200/90 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.65)]"
              style={{ left: `${marker.xPct}%` }}
            />
          )}
        </div>
        <p className="mt-0.5 text-center text-[8px] text-slate-500">
          {marker ? t('nav.compass_near', lang) : t('nav.compass_idle', lang)}
        </p>
      </div>
    </div>
  );
}
