/**
 * Тактическая карта на весь доступный экран под компактной панелью (как оверлей в Minecraft/NMS):
 * canvas на всю область, настройки — всплывающая панель по кнопке.
 */
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Crosshair, MapPinned, Trash2, Navigation, Settings } from 'lucide-react';
import type { DelayedConsequencePending, EnemyCoalition, Location, NPC, Weather } from '@/types/game';
import { buildCoalitionMapPins, type CoalitionMapPin } from '@/domain/map/coalitionMapPins';
import {
  buildDelayedConsequenceMapPins,
  type DelayedConsequenceMapPin,
} from '@/domain/map/delayedConsequenceMapPins';
import { delayedConsequenceStats } from '@/domain/consequences/delayedConsequenceQueue';
import { getLocationAnchor, TILE_PX } from '@/engine/worldTiles';
import { paintTacticalMap } from '@/engine/tacticalMapPaint';
import {
  loadNavigation,
  saveNavigation,
  pruneExpiredPings,
  type NavigationState
} from '@/lib/navigationStorage';
import { MapPanel } from '@/components/game/MapPanel';
import { soundManager } from '@/engine/SoundManager';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getLanguage, t } from '@/i18n';
import { toast } from 'sonner';

type Tab = 'world' | 'travel';

const COACH_LS = 'chronos_map_coach_dismissed';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface WorldTacticalMapOverlayProps {
  open: boolean;
  onClose: () => void;
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  locations: Location[];
  discoveredLocations: string[];
  currentLocation: Location;
  onTravel: (locationId: string) => void;
  enemyCoalitions?: EnemyCoalition[];
  delayedConsequences?: DelayedConsequencePending[];
}

export function WorldTacticalMapOverlay({
  open,
  onClose,
  worldSeed,
  playerTileX,
  playerTileY,
  timeHour,
  weather,
  npcs,
  locations,
  discoveredLocations,
  currentLocation,
  onTravel,
  enemyCoalitions,
  delayedConsequences,
}: WorldTacticalMapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = getLanguage();
  const [tab, setTab] = useState<Tab>('world');
  const [nav, setNav] = useState<NavigationState>(() => loadNavigation());
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number } | null>(
    null
  );
  const rafRef = useRef(0);
  const navFrameRef = useRef<NavigationState>(nav);
  const shellRef = useRef<HTMLDivElement>(null);
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const [coachRev, setCoachRev] = useState(0);
  const [coalitionHover, setCoalitionHover] = useState<CoalitionMapPin | null>(null);
  const [pendingHover, setPendingHover] = useState<DelayedConsequenceMapPin | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const coalitionPins = useMemo(
    () => buildCoalitionMapPins(enemyCoalitions, npcs),
    [enemyCoalitions, npcs],
  );
  const pendingPins = useMemo(
    () => buildDelayedConsequenceMapPins(delayedConsequences),
    [delayedConsequences],
  );
  const pendingStats = useMemo(
    () => delayedConsequenceStats(delayedConsequences),
    [delayedConsequences],
  );

  const syncNav = useCallback(() => {
    const n = loadNavigation();
    navFrameRef.current = n;
    setNav(n);
  }, []);

  const coachDismissed = (): boolean => {
    try {
      return localStorage.getItem(COACH_LS) === '1';
    } catch {
      return true;
    }
  };

  const mapCoachVisible = open && !coachDismissed();

  useEffect(() => {
    const fn = () => syncNav();
    window.addEventListener('chronos:navigation_updated', fn);
    return () => window.removeEventListener('chronos:navigation_updated', fn);
  }, [syncNav]);

  useEffect(() => {
    if (!open) return;
    syncNav();
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setTab('world');
    setMapReady(false);
  }, [open, syncNav]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const dismissMapCoach = useCallback(() => {
    try {
      localStorage.setItem(COACH_LS, '1');
    } catch {
      /* ignore */
    }
    setCoachRev((n) => n + 1);
    soundManager.play('click');
  }, []);

  /** Фокус внутри модального слоя + цикл Tab (a11y). Звук открытия карты — в GameScreen при M. */
  useEffect(() => {
    if (!open) return;
    const shell = shellRef.current;
    const prev = document.activeElement as HTMLElement | null;

    const focusables = shell?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !shell) return;
      const list = Array.from(shell.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0
      );
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    shell?.addEventListener('keydown', onKeyDown);
    return () => {
      shell?.removeEventListener('keydown', onKeyDown);
      prev?.focus?.();
    };
  }, [open, coachRev]);

  const persist = useCallback((next: NavigationState) => {
    navFrameRef.current = next;
    setNav(next);
    saveNavigation(next);
  }, []);

  const updateMapReadyFromSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw >= 8 && ch >= 8) setMapReady(true);
  }, []);

  /** Navigation read/prune — at most once per animation frame (see RAF loop). */
  const tickNavigationFrame = useCallback(() => {
    const n = loadNavigation();
    const pings = pruneExpiredPings(n.pings);
    if (pings.length !== n.pings.length) {
      const next = { ...n, pings };
      saveNavigation(next);
      navFrameRef.current = next;
      setNav(next);
      return next;
    }
    navFrameRef.current = n;
    return n;
  }, []);

  const projectScreenToTile = useCallback(
    (mx: number, my: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { tileX: 0, tileY: 0 };
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const z = Math.min(3.2, Math.max(0.45, zoomRef.current)) * nav.settings.mapZoomSensitivity;
      const wWide = cw * z;
      const hWide = ch * z;
      const cx = playerTileX * TILE_PX + panRef.current.x;
      const cy = playerTileY * TILE_PX + panRef.current.y;
      const viewLeft = cx - wWide / 2;
      const viewTop = cy - hWide / 2;
      const worldX = viewLeft + (mx / cw) * wWide;
      const worldY = viewTop + (my / ch) * hWide;
      return { tileX: worldX / TILE_PX, tileY: worldY / TILE_PX };
    },
    [playerTileX, playerTileY, nav.settings.mapZoomSensitivity],
  );

  const paint = useCallback(
    (frameNav: NavigationState) => {
      const canvas = canvasRef.current;
      if (!canvas || !open || tab !== 'world') return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw < 8 || ch < 8) return;
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

      const z =
        Math.min(3.2, Math.max(0.45, zoomRef.current)) * nav.settings.mapZoomSensitivity;
      const wWide = cw * z;
      const hWide = ch * z;
      const cx = playerTileX * TILE_PX + panRef.current.x;
      const cy = playerTileY * TILE_PX + panRef.current.y;
      const viewLeft = cx - wWide / 2;
      const viewTop = cy - hWide / 2;

      ctx.save();
      ctx.scale(1 / z, 1 / z);

      paintTacticalMap({
        ctx,
        cw: wWide,
        ch: hWide,
        pixelScale: TILE_PX,
        viewLeft,
        viewTop,
        worldSeed,
        timeHour,
        weather,
        npcs,
        playerTileX,
        playerTileY,
        waypoints: frameNav.waypoints,
        pings: frameNav.pings,
        now: Date.now(),
        lite: false,
        coalitionPins: coalitionPins.map((p) => ({ tileX: p.tileX, tileY: p.tileY })),
        pendingConsequencePins: pendingPins.map((p) => ({
          tileX: p.tileX,
          tileY: p.tileY,
          urgency01: Math.max(0, Math.min(1, 1 - p.remainingHours / 48)),
        })),
      });
      ctx.restore();
    },
    [
      open,
      tab,
      worldSeed,
      timeHour,
      weather,
      npcs,
      playerTileX,
      playerTileY,
      nav.settings.mapZoomSensitivity,
      coalitionPins,
      pendingPins,
    ],
  );

  useEffect(() => {
    if (!open || tab !== 'world') return;
    let running = true;
    const loop = () => {
      if (!running) return;
      const frameNav = tickNavigationFrame();
      paint(frameNav);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [open, tab, paint, tickNavigationFrame]);

  useEffect(() => {
    if (!open || tab !== 'world') return;
    const frame = mapFrameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      updateMapReadyFromSize();
    });
    ro.observe(frame);
    updateMapReadyFromSize();
    return () => ro.disconnect();
  }, [open, tab, updateMapReadyFromSize]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = 0.09 / nav.settings.mapZoomSensitivity;
    zoomRef.current = Math.min(3.2, Math.max(0.45, zoomRef.current + (e.deltaY > 0 ? step : -step)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0) {
      dragRef.current = {
        active: true,
        sx: e.clientX,
        sy: e.clientY,
        ox: panRef.current.x,
        oy: panRef.current.y
      };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (d?.active) {
      const sp = nav.settings.edgePanSpeed;
      const z = Math.min(3.2, Math.max(0.45, zoomRef.current));
      panRef.current = {
        x: d.ox + (e.clientX - d.sx) * sp * 0.65 * z,
        y: d.oy + (e.clientY - d.sy) * sp * 0.65 * z,
      };
      return;
    }
    if (tab !== 'world' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const t = projectScreenToTile(mx, my);
    const pendingHit =
      pendingPins.find((p) => Math.hypot(t.tileX - p.tileX, t.tileY - p.tileY) < 2.4) ?? null;
    setPendingHover(pendingHit);
    if (pendingHit) {
      setCoalitionHover(null);
      return;
    }
    const coalitionHit =
      coalitionPins.find((p) => Math.hypot(t.tileX - p.tileX, t.tileY - p.tileY) < 2.4) ?? null;
    setCoalitionHover(coalitionHit);
  };

  const endDrag = () => {
    if (dragRef.current) dragRef.current.active = false;
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { tileX, tileY } = projectScreenToTile(mx, my);
    const id = `wp_${Date.now()}`;
    const n = loadNavigation();
    persist({
      ...n,
      waypoints: [
        ...n.waypoints,
        { id, tileX, tileY, label: t('nav.waypoint_default', lang), color: '#22d3ee' }
      ]
    });
    soundManager.play('mapWaypoint');
    toast.info(t('nav.waypoint_toast', lang));
  };

  const clearWaypoints = () => {
    const n = loadNavigation();
    persist({ ...n, waypoints: [] });
    soundManager.play('click');
  };

  const centerPlayer = () => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    soundManager.play('click');
  };

  if (!open) return null;

  const dim = 1 - nav.settings.mapOpacity * 0.4;

  return (
    <div
      ref={shellRef}
      data-testid="chronos-tactical-map"
      className="fixed inset-0 z-[200] flex h-[100dvh] w-screen animate-in fade-in flex-col overflow-hidden duration-200 outline-none"
      style={{ background: `rgba(4,6,12,${dim})` }}
      role="dialog"
      aria-modal
      aria-label={t('nav.tactical_map', lang)}
      tabIndex={-1}
    >
      <div
        className="pointer-events-none absolute inset-0 backdrop-blur-md"
        style={{ WebkitBackdropFilter: 'blur(14px)' } as CSSProperties}
      />
      <div
        className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {mapCoachVisible ? (
          <div
            className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/35 bg-amber-950/50 px-3 py-2 text-sm text-amber-100/95 shadow-[0_0_20px_rgba(251,191,36,0.12)] backdrop-blur-md"
            role="status"
          >
            <span className="min-w-0 flex-1">{t('nav.map_coach', lang)}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shrink-0 border-amber-400/40 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
              onClick={dismissMapCoach}
            >
              {t('nav.map_coach_ok', lang)}
            </Button>
          </div>
        ) : null}
        <div className="z-30 flex shrink-0 flex-wrap items-center justify-between gap-2 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-black/55 px-2 py-1 backdrop-blur-md">
            <Button
              type="button"
              size="sm"
              variant={tab === 'world' ? 'secondary' : 'ghost'}
              className={
                tab === 'world'
                  ? 'bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40 transition-all duration-200'
                  : 'text-slate-300 transition-all duration-200 hover:bg-white/5'
              }
              onClick={() => {
                setTab('world');
                soundManager.play('click');
              }}
            >
              <MapPinned className="mr-1.5 h-4 w-4" />
              {t('nav.tab_world', lang)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === 'travel' ? 'secondary' : 'ghost'}
              className={
                tab === 'travel'
                  ? 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40 transition-all duration-200'
                  : 'text-slate-300 transition-all duration-200 hover:bg-white/5'
              }
              onClick={() => {
                setTab('travel');
                soundManager.play('click');
              }}
            >
              <Navigation className="mr-1.5 h-4 w-4" />
              {t('nav.tab_travel', lang)}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-cyan-500/30 bg-black/40 text-cyan-100"
              onClick={centerPlayer}
            >
              <Crosshair className="mr-1 h-4 w-4" />
              {t('nav.center_player', lang)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/15 bg-black/40"
              onClick={clearWaypoints}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('nav.clear_pins', lang)}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-slate-300 hover:text-white"
              onClick={() => {
                soundManager.play('click');
                onClose();
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {pendingStats.count > 0 && tab === 'world' && (
          <p className="mx-2 mb-2 shrink-0 rounded-lg border border-cyan-400/25 bg-cyan-950/40 px-2 py-1 text-[11px] text-cyan-100/90">
            {lang === 'ru'
              ? `Ожидаемые последствия на карте: ${pendingStats.count} (ближайшее ~${pendingStats.minHours} ч.)`
              : `Pending consequences on map: ${pendingStats.count} (next ~${pendingStats.minHours}h)`}
          </p>
        )}

        {tab === 'world' ? (
          <div
            ref={mapFrameRef}
            className="relative mx-2 mb-2 min-h-0 min-h-[50dvh] flex-1 overflow-hidden rounded-lg border border-cyan-500/25 shadow-[inset_0_0_80px_rgba(34,211,238,0.06)]"
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={t('nav.tactical_map', lang)}
              className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={endDrag}
              onMouseLeave={() => {
                endDrag();
                setCoalitionHover(null);
                setPendingHover(null);
              }}
              onContextMenu={onContextMenu}
            />
            {!mapReady && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-xs uppercase tracking-[0.18em] text-cyan-100/85">
                {lang === 'ru' ? 'Загрузка карты…' : 'Loading map...'}
              </div>
            )}
            {pendingHover && (
              <div
                className="pointer-events-none absolute bottom-14 left-2 right-14 z-10 rounded-lg border border-cyan-500/45 bg-cyan-950/92 px-3 py-2 text-left text-[11px] text-cyan-50 shadow-lg backdrop-blur-md sm:right-20"
                role="status"
              >
                <p className="font-semibold text-cyan-100/95">{t('nav.pending_tooltip_title', lang)}</p>
                <p className="mt-1 text-cyan-100/85">
                  {t('nav.pending_tooltip_body', lang)
                    .replace(
                      '{{loc}}',
                      lang === 'ru'
                        ? getLocationAnchor(pendingHover.locationId).labelRu
                        : pendingHover.locationId.replace(/_/g, ' '),
                    )
                    .replace('{{hours}}', String(pendingHover.remainingHours))
                    .replace('{{type}}', pendingHover.consequenceType)}
                </p>
              </div>
            )}
            {coalitionHover && !pendingHover && (
              <div
                className="pointer-events-none absolute bottom-14 left-2 right-14 z-10 rounded-lg border border-rose-500/45 bg-rose-950/92 px-3 py-2 text-left text-[11px] text-rose-50 shadow-lg backdrop-blur-md sm:right-20"
                role="status"
              >
                <p className="font-semibold text-rose-100/95">{t('nav.coalition_tooltip_title', lang)}</p>
                <p className="mt-1 text-rose-100/85">
                  {t('nav.coalition_tooltip_body', lang)
                    .replace('{{leader}}', coalitionHover.leaderLabel)
                    .replace('{{n}}', String(coalitionHover.memberCount))}
                </p>
              </div>
            )}
            <p className="pointer-events-none absolute bottom-3 left-3 right-16 max-w-[min(100%,28rem)] rounded-lg bg-black/60 px-2 py-1 text-[10px] leading-snug text-slate-400 backdrop-blur-sm sm:right-24">
              {t('nav.map_hint', lang)}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-3 right-3 z-20 h-11 w-11 border border-cyan-500/35 bg-black/65 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md hover:bg-black/80"
                  aria-label={t('nav.map_panel_settings', lang)}
                >
                  <Settings className="h-5 w-5" aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={10}
                collisionPadding={16}
                className="z-[260] w-[min(100vw-2rem,20rem)] border-white/15 bg-slate-950/95 p-4 text-slate-100 shadow-xl backdrop-blur-xl"
              >
                <p className="mb-3 text-xs font-medium text-slate-300">{t('nav.map_tools_heading', lang)}</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label className="text-xs text-slate-400">{t('nav.opacity', lang)}</Label>
                    <Slider
                      value={[nav.settings.mapOpacity]}
                      min={0.35}
                      max={0.98}
                      step={0.02}
                      onValueChange={([v]) =>
                        persist({ ...nav, settings: { ...nav.settings, mapOpacity: v } })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">{t('nav.zoom_sens', lang)}</Label>
                    <Slider
                      value={[nav.settings.mapZoomSensitivity]}
                      min={0.5}
                      max={1.8}
                      step={0.05}
                      onValueChange={([v]) =>
                        persist({ ...nav, settings: { ...nav.settings, mapZoomSensitivity: v } })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-slate-300">{t('nav.north_lock', lang)}</Label>
                    <Switch
                      checked={nav.settings.northLock}
                      onCheckedChange={(c) =>
                        persist({ ...nav, settings: { ...nav.settings, northLock: !!c } })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">{t('nav.edge_pan', lang)}</Label>
                    <Slider
                      value={[nav.settings.edgePanSpeed]}
                      min={0.4}
                      max={2}
                      step={0.05}
                      onValueChange={([v]) =>
                        persist({ ...nav, settings: { ...nav.settings, edgePanSpeed: v } })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-violet-500/20 bg-black/50 p-3 backdrop-blur-md sm:p-4">
            <MapPanel
              locations={locations}
              discoveredLocations={discoveredLocations}
              currentLocation={currentLocation}
              onTravel={(id) => {
                onTravel(id);
                soundManager.play('travel');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
