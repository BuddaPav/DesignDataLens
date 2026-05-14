// Main Game Screen - Enhanced Edition

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { 
  Map, BookOpen, User, ShoppingBag, Save, Heart, Sparkles, 
  Brain, Sword, Zap, Eye, Users, X, Settings, Clock, ScrollText, Globe2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  Player,
  Location,
  Scene,
  Quest,
  NPC,
  ShopItem,
  WorldLogEntry,
  WorldPosition,
  Choice
} from '@/types/game';
import type { ShopPurchaseResult } from '@/domain/economy/shopPurchase';
import { SceneRenderer } from '@/components/game/SceneRenderer';
import { WorldCanvas } from '@/components/game/WorldCanvas';
import { t } from '@/i18n';
import { useLanguage } from '@/i18n/LanguageProvider';

const WorldViewportLazy = lazy(() =>
  import('@/components/game/WorldViewport').then((m) => ({ default: m.WorldViewport }))
);
const NPCPanel = lazy(() =>
  import('@/components/game/NPCPanel').then((m) => ({ default: m.NPCPanel }))
);
const QuestPanel = lazy(() =>
  import('@/components/game/QuestPanel').then((m) => ({ default: m.QuestPanel }))
);
const InventoryPanel = lazy(() =>
  import('@/components/game/InventoryPanel').then((m) => ({ default: m.InventoryPanel }))
);
const ShopPanel = lazy(() =>
  import('@/components/game/ShopPanel').then((m) => ({ default: m.ShopPanel }))
);
const WorldStatusPanel = lazy(() =>
  import('@/components/game/WorldStatusPanel').then((m) => ({ default: m.WorldStatusPanel }))
);
import { WorldTacticalMapOverlay } from '@/components/game/WorldTacticalMapOverlay';
import { NavigationMinimap } from '@/components/game/NavigationMinimap';
import { NavigationCompassBar } from '@/components/game/NavigationCompassBar';
import { loadNavigation, saveNavigation, addWorldPing } from '@/lib/navigationStorage';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { ParticleSystem } from '@/components/effects/ParticleSystem';
import { TiltCard, AnimatedStatBar, NeonText } from '@/components/effects/VisualEffects';
import { soundManager } from '@/engine/SoundManager';
import { toast } from 'sonner';
import { readWorldGraphicsTier } from '@/lib/chronosGraphicsSettings';
import { getLocationStanding } from '@/domain/social/locationReputation';
import { CombatQuestEligibilityDevPanel } from '@/components/debug/CombatQuestEligibilityDevPanel';
import { CHRONOS_SETTINGS_STORAGE_KEY } from '@/lib/chronosGameSettings';
import {
  CHRONOS_BROWSER_NOTIFY_TAGS,
  notifyGameBrowserEvent,
} from '@/domain/notifications/browserNotifications';

function readHighQualityGraphics(): boolean {
  try {
    const raw = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
    if (!raw) return true;
    const j = JSON.parse(raw) as { highQualityGraphics?: boolean };
    return j.highQualityGraphics !== false;
  } catch {
    return true;
  }
}

interface GameScreenProps {
  player: Player | null;
  currentLocation: Location;
  currentScene: Scene | null;
  currentQuest: Quest | null;
  npcs: NPC[];
  /** Все NPC для отрисовки на карте мира */
  worldMapNpcs: NPC[];
  worldPosition: WorldPosition;
  worldSeed: number;
  updateWorldPosition: (d: { dTileX: number; dTileY: number }) => void;
  locations: Location[];
  shopItems: ShopItem[];
  /** Покупка за игровое золото (списание + награды). */
  onPurchaseShopItem: (itemId: string) => ShopPurchaseResult;
  lastError?: string | null;
  worldEventLog: WorldLogEntry[];
  onChoice: (choice: Choice) => void;
  onTravel: (locationId: string) => void;
  onNPCInteract: (npcId: string, type: string, customLine?: string) => void;
  /** Следующая сцена без вариантов выбора */
  onContinueStory?: () => void;
  /** 0..1 — загрузка весов WebLLM (null — нет активной загрузки) */
  llmLoadProgress?: number | null;
  onGenerateQuest: (type: 'main' | 'side' | 'character') => void;
  onSave: () => void;
  /** Пропуск времени: симуляция NPC и журнал событий */
  onAdvanceTime: (hours: number) => void;
  /** true пока advanceTime выполняется (worker/симуляции) */
  isAdvancingTime?: boolean;
}

export function GameScreen({
  player,
  currentLocation,
  currentScene,
  currentQuest,
  npcs,
  worldMapNpcs,
  worldPosition,
  worldSeed,
  updateWorldPosition,
  locations,
  shopItems,
  onPurchaseShopItem,
  lastError,
  worldEventLog,
  onChoice,
  onTravel,
  onNPCInteract,
  onContinueStory,
  llmLoadProgress,
  onGenerateQuest,
  onSave,
  onAdvanceTime,
  isAdvancingTime
}: GameScreenProps) {
  const [activePanel, setActivePanel] = useState<
    'none' | 'inventory' | 'quests' | 'npcs' | 'shop' | 'world'
  >('none');
  const [tacticalMapOpen, setTacticalMapOpen] = useState(false);
  const [navHud, setNavHud] = useState(() => loadNavigation());
  const [showCharacterPanel, setShowCharacterPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticles] = useState(true);
  const [hqWorld, setHqWorld] = useState(readHighQualityGraphics);
  const [worldGraphicsTier, setWorldGraphicsTier] = useState(readWorldGraphicsTier);
  const lang = useLanguage();
  const [settingsTick, setSettingsTick] = useState(0);

  const handleShopPurchase = (itemId: string) => {
    const res = onPurchaseShopItem(itemId);
    if (res.ok) {
      const shopOk = t('game.shop.toast_ok', lang);
      toast.success(shopOk);
      notifyGameBrowserEvent({
        tag: CHRONOS_BROWSER_NOTIFY_TAGS.shopPurchase,
        title: shopOk,
      });
      soundManager.play('coin');
    } else if (!res.ok && res.reason === 'not_enough_gold') {
      toast.error(t('game.shop.toast_no_gold', lang));
    }
  };

  const localStanding = useMemo(() => {
    if (!player) return null;
    return getLocationStanding(player.stats.reputation, currentLocation.id);
  }, [player, currentLocation.id]);

  const colorBlindCanvasFilter = useMemo(() => {
    void settingsTick;
    try {
      const raw = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
      const m = raw ? (JSON.parse(raw) as { colorBlindMode?: string }).colorBlindMode : 'none';
      if (m === 'protanopia') return 'saturate(1.22) hue-rotate(-14deg) contrast(1.06)';
      if (m === 'deuteranopia') return 'saturate(1.18) hue-rotate(10deg) contrast(1.05)';
      if (m === 'tritanopia') return 'saturate(1.12) hue-rotate(22deg) contrast(1.05)';
    } catch {
      /* ignore */
    }
    return undefined;
  }, [settingsTick]);

  useEffect(() => {
    const sync = () => {
      setHqWorld(readHighQualityGraphics());
      setWorldGraphicsTier(readWorldGraphicsTier());
      setSettingsTick((n) => n + 1);
    };
    window.addEventListener('chronos:settings_updated', sync);
    return () => window.removeEventListener('chronos:settings_updated', sync);
  }, []);

  useEffect(() => {
    const syncNav = () => setNavHud(loadNavigation());
    syncNav();
    window.addEventListener('chronos:navigation_updated', syncNav);
    const tick = window.setInterval(() => {
      const n = loadNavigation();
      const pruned = n.pings.filter((p) => p.until > Date.now());
      if (pruned.length !== n.pings.length) {
        saveNavigation({ ...n, pings: pruned });
      }
    }, 450);
    return () => {
      window.removeEventListener('chronos:navigation_updated', syncNav);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showSettings || showCharacterPanel) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, [contenteditable="true"]')) return;
      if (e.code === 'KeyM') {
        e.preventDefault();
        setTacticalMapOpen((v) => {
          const next = !v;
          if (next) soundManager.play('mapOpen');
          else soundManager.play('click');
          return next;
        });
      }
      if (e.code === 'Escape') {
        if (tacticalMapOpen) {
          e.preventDefault();
          setTacticalMapOpen(false);
          soundManager.play('click');
        } else if (activePanel !== 'none') {
          e.preventDefault();
          setActivePanel('none');
          soundManager.play('click');
        }
      }
      if (e.code === 'KeyI') {
        e.preventDefault();
        setActivePanel((p) => (p === 'inventory' ? 'none' : 'inventory'));
        soundManager.play('click');
      }
      if (e.code === 'KeyQ') {
        e.preventDefault();
        setActivePanel((p) => (p === 'quests' ? 'none' : 'quests'));
        soundManager.play('click');
      }
      if (e.code === 'KeyG') {
        e.preventDefault();
        addWorldPing(worldPosition.tileX, worldPosition.tileY);
        soundManager.play('mapWaypoint');
        toast.info(t('nav.ping_toast', lang));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    showSettings,
    showCharacterPanel,
    tacticalMapOpen,
    activePanel,
    worldPosition.tileX,
    worldPosition.tileY,
    lang
  ]);

  const spatialNpcLines = useMemo(() => {
    if (!hqWorld) return undefined;
    const dlg = currentScene?.dialogue;
    if (!dlg?.length) return undefined;
    return dlg.map((d) => ({
      npcId: d.speakerId,
      speakerName: d.speakerName,
      text: d.text
    }));
  }, [hqWorld, currentScene?.dialogue]);

  if (!player) return null;

  const worldMapProps = {
    worldSeed,
    playerTileX: worldPosition.tileX,
    playerTileY: worldPosition.tileY,
    onMove: updateWorldPosition,
    timeHour: player.storyProgress.worldState.time.hour,
    weather: player.storyProgress.worldState.weather,
    npcs: worldMapNpcs,
    onNpcClick: (id: string) => onNPCInteract(id, 'talk')
  } as const;

  const handleSave = () => {
    onSave();
    soundManager.play('save');
    const saveTitle = t('game.save_title', lang);
    const saveDesc = t('game.save_desc', lang);
    toast.success(saveTitle, {
      description: saveDesc
    });
    notifyGameBrowserEvent({
      tag: CHRONOS_BROWSER_NOTIFY_TAGS.manualSave,
      title: saveTitle,
      body: saveDesc,
    });
  };

  const handleTravel = (locationId: string) => {
    onTravel(locationId);
    soundManager.play('travel');
    setActivePanel('none');
  };

  const handleChoice = (choice: Choice) => {
    onChoice(choice);
    soundManager.play('click');
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="game-screen">
      {/* Ambient particles */}
      {showParticles && (
        <ParticleSystem 
          type="magic" 
          intensity="low" 
          className="fixed inset-0 pointer-events-none z-0"
        />
      )}

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-gradient-to-b from-[var(--chronos-surface)]/95 to-[#0d0f14]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(102,252,241,0.06)_inset] p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Character info */}
          <TiltCard className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowCharacterPanel(true);
                soundManager.play('click');
              }}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center hover:scale-105 transition-transform group"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              <User className="w-7 h-7 text-white relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <span className="text-[10px] font-bold">{player.character.level}</span>
              </div>
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg tracking-tight text-[var(--chronos-text)] truncate">
                {player.character.name}
              </h1>
              <p className="text-sm text-[var(--chronos-text-secondary)] flex items-center gap-1.5 truncate">
                <Map className="w-3 h-3 shrink-0 text-[var(--chronos-primary-hex)]/80" />
                {currentLocation.name}
              </p>
            </div>
          </TiltCard>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <div className="w-28">
                <AnimatedStatBar 
                  value={player.stats.health} 
                  max={player.stats.maxHealth} 
                  color="red"
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">
                {player.stats.health}/{player.stats.maxHealth}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div className="w-28">
                <AnimatedStatBar 
                  value={player.stats.mana} 
                  max={player.stats.maxMana} 
                  color="blue"
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">
                {player.stats.mana}/{player.stats.maxMana}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('game.footer_aria_inventory', lang)}
              onClick={() => {
                setActivePanel(activePanel === 'inventory' ? 'none' : 'inventory');
                soundManager.play('click');
              }}
              className={`relative transition-colors ${activePanel === 'inventory' ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/25' : 'hover:bg-white/[0.04]'}`}
            >
              <BookOpen className="w-5 h-5" />
              {player.inventory.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full text-[10px] flex items-center justify-center">
                  {player.inventory.items.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('game.footer_aria_map', lang)}
              title={t('nav.map_key_hint', lang)}
              onClick={() => {
                setActivePanel('none');
                setTacticalMapOpen(true);
                soundManager.play('mapOpen');
              }}
              className={
                tacticalMapOpen
                  ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/25'
                  : 'hover:bg-white/[0.04]'
              }
            >
              <Map className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('game.footer_aria_save', lang)}
              onClick={handleSave}
              className="hover:text-emerald-400"
            >
              <Save className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('game.footer_aria_settings', lang)}
              onClick={() => {
                setShowSettings(true);
                soundManager.play('click');
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <p className="hidden lg:block relative z-10 border-b border-white/[0.04] bg-black/20 px-4 py-1 text-center text-[10px] text-slate-500 font-medium tracking-wide">
        {t('game.hotkeys_hint', lang)}
      </p>

      {llmLoadProgress != null && (
        <div className="relative z-10 border-b border-white/[0.05] bg-black/40 px-4 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--chronos-text-secondary)] mb-1.5">
            {t('game.llm_loading', lang)}
          </p>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden ring-1 ring-[var(--chronos-primary-hex)]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--chronos-primary-hex)] via-violet-400 to-fuchsia-500 transition-[width] duration-300 shadow-[0_0_12px_rgba(102,252,241,0.35)]"
              style={{ width: `${Math.round(Math.min(1, Math.max(0, llmLoadProgress)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!tacticalMapOpen && navHud.settings.minimapEnabled && (
        <NavigationMinimap
          enabled
          worldSeed={worldSeed}
          playerTileX={worldPosition.tileX}
          playerTileY={worldPosition.tileY}
          timeHour={player.storyProgress.worldState.time.hour}
          weather={player.storyProgress.worldState.weather}
          npcs={worldMapNpcs}
          colorFilter={colorBlindCanvasFilter}
        />
      )}
      {!hqWorld && !tacticalMapOpen && (
        <NavigationCompassBar
          playerTileX={worldPosition.tileX}
          playerTileY={worldPosition.tileY}
          npcs={worldMapNpcs}
        />
      )}

      {/* Журнал событий мира — последние записи */}
      {worldEventLog.length > 0 && (
        <div className="relative z-10 border-b border-white/[0.05] bg-black/35 py-2.5 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[var(--chronos-text-secondary)]">
            <ScrollText className="w-3.5 h-3.5 shrink-0 text-[var(--chronos-primary-hex)]/90" />
            <div className="flex-1 min-w-0 flex gap-4 overflow-x-auto scrollbar-thin">
              {worldEventLog.slice(-8).map((e) => (
                <span
                  key={e.id}
                  className={
                    e.severity === 'dramatic'
                      ? 'text-amber-200/90 whitespace-nowrap'
                      : e.severity === 'rumor'
                        ? 'text-slate-300 whitespace-nowrap'
                        : 'text-slate-500 whitespace-nowrap'
                  }
                >
                  {e.message}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main: при HQ-3D — мир на весь блок + компактный сюжет поверх; иначе классическая двухколонка */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {hqWorld ? (
          <div className="relative flex flex-1 min-w-0 min-h-0 flex-col">
            <div className="min-h-0 flex-1 shrink-0 border-b border-[var(--chronos-border)]/70 p-4 md:p-6">
              <div className="mx-auto flex h-full min-h-[52vh] w-full max-w-6xl flex-col">
                <Suspense
                  fallback={
                    <WorldCanvas
                      worldSeed={worldMapProps.worldSeed}
                      playerTileX={worldMapProps.playerTileX}
                      playerTileY={worldMapProps.playerTileY}
                      onMove={worldMapProps.onMove}
                      timeHour={worldMapProps.timeHour}
                      weather={worldMapProps.weather}
                      npcs={worldMapProps.npcs}
                      onNpcClick={worldMapProps.onNpcClick}
                    />
                  }
                >
                  <WorldViewportLazy
                    hqWorld
                    worldSeed={worldMapProps.worldSeed}
                    playerTileX={worldMapProps.playerTileX}
                    playerTileY={worldMapProps.playerTileY}
                    onMove={worldMapProps.onMove}
                    timeHour={worldMapProps.timeHour}
                    weather={worldMapProps.weather}
                    npcs={worldMapProps.npcs}
                    onNpcClick={worldMapProps.onNpcClick}
                    worldEra={player.character.worldEra}
                    spatialNpcLines={spatialNpcLines}
                    worldPings={navHud.pings}
                    graphicsTier={worldGraphicsTier}
                  />
                </Suspense>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 z-[15] flex flex-col justify-end pb-[4.75rem] md:pb-20">
              <div className="pointer-events-auto mx-auto max-h-[min(38vh,440px)] w-full max-w-3xl overflow-y-auto px-3 sm:px-4">
                {lastError && (
                  <div className="mb-4 rounded-xl border border-rose-500/35 bg-gradient-to-br from-rose-950/80 to-black/40 p-3 text-rose-100 shadow-lg shadow-rose-950/30 ring-1 ring-rose-400/10 backdrop-blur-md">
                    <p className="font-display mb-1 text-sm font-semibold tracking-tight">
                      {t('game.gen_error_title', lang)}
                    </p>
                    <p className="text-xs leading-relaxed text-rose-100/85">{lastError}</p>
                  </div>
                )}
                {currentScene ? (
                  <SceneRenderer
                    immersiveStory
                    scene={currentScene}
                    location={currentLocation}
                    npcs={npcs}
                    onChoice={handleChoice}
                    onNPCInteract={onNPCInteract}
                    onContinueStory={onContinueStory}
                  />
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-black/35 py-12 text-center backdrop-blur-md">
                    <Sparkles className="mx-auto mb-3 h-12 w-12 animate-pulse text-violet-400" />
                    <p className="text-sm text-slate-400">{t('game.story_unfolding', lang)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto border-b border-[var(--chronos-border)] p-4 md:p-6 lg:max-w-[60%] lg:w-[60%] lg:border-b-0 lg:border-r">
              <div className="mx-auto w-full max-w-4xl shrink-0">
                <WorldCanvas
                  worldSeed={worldMapProps.worldSeed}
                  playerTileX={worldMapProps.playerTileX}
                  playerTileY={worldMapProps.playerTileY}
                  onMove={worldMapProps.onMove}
                  timeHour={worldMapProps.timeHour}
                  weather={worldMapProps.weather}
                  npcs={worldMapProps.npcs}
                  onNpcClick={worldMapProps.onNpcClick}
                />
              </div>
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mx-auto min-h-0 w-full max-w-3xl">
                {lastError && (
                  <div className="mb-6 rounded-xl border border-rose-500/35 bg-gradient-to-br from-rose-950/80 to-black/40 p-4 text-rose-100 shadow-lg shadow-rose-950/30 ring-1 ring-rose-400/10">
                    <p className="font-display mb-1 font-semibold tracking-tight">
                      {t('game.gen_error_title', lang)}
                    </p>
                    <p className="text-sm leading-relaxed text-rose-100/85">{lastError}</p>
                  </div>
                )}
                {currentScene ? (
                  <SceneRenderer
                    scene={currentScene}
                    location={currentLocation}
                    npcs={npcs}
                    onChoice={handleChoice}
                    onNPCInteract={onNPCInteract}
                    onContinueStory={onContinueStory}
                  />
                ) : (
                  <div className="py-20 text-center">
                    <Sparkles className="mx-auto mb-4 h-16 w-16 animate-pulse text-violet-400" />
                    <p className="text-slate-400">{t('game.story_unfolding', lang)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Side panel — ширина 360px по спецификации Kimi */}
        {activePanel !== 'none' && (
          <div
            data-testid="chronos-side-panel"
            className="w-full max-w-[min(360px,60vw)] shrink-0 border-l border-white/[0.06] bg-gradient-to-b from-[var(--chronos-surface)]/98 to-[#0a0c10]/98 backdrop-blur-xl overflow-y-auto animate-slide-in-right relative z-20 shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.45)]"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.06]">
                <h2 className="font-display font-bold text-lg tracking-tight text-[var(--chronos-text)]">
                  {activePanel === 'inventory' && t('game.panel_inventory', lang)}
                  {activePanel === 'quests' && t('game.panel_quests', lang)}
                  {activePanel === 'npcs' && t('game.panel_npcs', lang)}
                  {activePanel === 'shop' && t('game.panel_shop', lang)}
                  {activePanel === 'world' && t('game.panel_world', lang)}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePanel('none')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {activePanel === 'inventory' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[120px] items-center justify-center p-6 text-sm text-slate-500">
                      {t('game.panel_loading', lang)}
                    </div>
                  }
                >
                  <InventoryPanel inventory={player.inventory} stats={player.stats} />
                </Suspense>
              )}

              {activePanel === 'quests' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[120px] items-center justify-center p-6 text-sm text-slate-500">
                      {t('game.panel_loading', lang)}
                    </div>
                  }
                >
                  <QuestPanel
                    activeQuests={player.storyProgress.activeQuests}
                    completedQuests={player.storyProgress.completedQuests}
                    currentQuest={currentQuest}
                    onGenerateQuest={onGenerateQuest}
                    factionReputation={player.storyProgress.factionReputation}
                    playerReputation={player.stats.reputation}
                    currentLocationId={currentLocation.id}
                    lang={lang}
                  />
                </Suspense>
              )}

              {activePanel === 'npcs' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[120px] items-center justify-center p-6 text-sm text-slate-500">
                      {t('game.panel_loading', lang)}
                    </div>
                  }
                >
                  <NPCPanel npcs={npcs} metNPCs={player.storyProgress.metNPCs} onInteract={onNPCInteract} />
                </Suspense>
              )}

              {activePanel === 'shop' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[120px] items-center justify-center p-6 text-sm text-slate-500">
                      {t('game.panel_loading', lang)}
                    </div>
                  }
                >
                  <ShopPanel
                    items={shopItems}
                    gold={player.inventory.gold}
                    locationId={currentLocation.id}
                    factionPowers={player.storyProgress.worldState.factionPowers}
                    onPurchase={handleShopPurchase}
                  />
                </Suspense>
              )}

              {activePanel === 'world' && (
                <Suspense
                  fallback={
                    <div className="flex min-h-[120px] items-center justify-center p-6 text-sm text-slate-500">
                      {t('game.panel_loading', lang)}
                    </div>
                  }
                >
                  <WorldStatusPanel
                    factionReputation={player.storyProgress.factionReputation}
                    activeRumors={player.storyProgress.activeRumors}
                    enemyCoalitions={player.storyProgress.enemyCoalitions}
                    worldEventLog={player.storyProgress.worldEventLog}
                    npcs={npcs}
                    playerLocationId={currentLocation.id}
                    lang={lang}
                  />
                </Suspense>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quick actions bar */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-gradient-to-t from-[#08090c] to-[var(--chronos-surface)]/90 backdrop-blur-xl p-2 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.35)]">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          {player && localStanding !== null && (
            <span
              className="mr-1 hidden min-[420px]:inline text-[10px] tabular-nums text-slate-500"
              title={t('game.footer_local_standing_title', lang)}
            >
              {t('game.footer_local_standing', lang).replace('{{n}}', String(Math.round(localStanding)))}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('game.footer_aria_npcs', lang)}
            onClick={() => {
              setActivePanel(activePanel === 'npcs' ? 'none' : 'npcs');
              soundManager.play('click');
            }}
            className={
              activePanel === 'npcs'
                ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/20'
                : 'hover:bg-white/[0.04]'
            }
          >
            <Users className="w-4 h-4 mr-2" />
            {t('game.side_people', lang)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('game.footer_aria_quests', lang)}
            onClick={() => {
              setActivePanel(activePanel === 'quests' ? 'none' : 'quests');
              soundManager.play('click');
            }}
            className={
              activePanel === 'quests'
                ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/20'
                : 'hover:bg-white/[0.04]'
            }
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t('game.side_quests_tab', lang)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('game.footer_aria_time', lang)}
            onClick={() => {
              if (isAdvancingTime) return;
              onAdvanceTime(6);
              soundManager.play('click');
              toast.info(t('game.time_advance_title', lang), {
                description: t('game.time_advance_desc', lang)
              });
            }}
            className={
              isAdvancingTime
                ? 'text-amber-200/40 cursor-not-allowed'
                : 'text-amber-200/90 hover:text-amber-100'
            }
            title={t('game.advance_time_title', lang)}
          >
            <Clock className="w-4 h-4 mr-2" />
            {isAdvancingTime ? t('game.advance_time_pending', lang) : t('game.advance_time_button', lang)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('game.footer_aria_world', lang)}
            onClick={() => {
              setActivePanel(activePanel === 'world' ? 'none' : 'world');
              soundManager.play('click');
            }}
            className={
              activePanel === 'world'
                ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/20'
                : 'hover:bg-white/[0.04]'
            }
            title={t('game.panel_world', lang)}
          >
            <Globe2 className="w-4 h-4 mr-2" />
            {t('game.side_world', lang)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('game.footer_aria_shop', lang)}
            onClick={() => {
              setActivePanel(activePanel === 'shop' ? 'none' : 'shop');
              soundManager.play('click');
            }}
            className={
              activePanel === 'shop'
                ? 'bg-white/[0.08] text-[var(--chronos-primary-hex)] ring-1 ring-[var(--chronos-primary-hex)]/20'
                : 'hover:bg-white/[0.04]'
            }
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t('game.side_shop', lang)}
          </Button>
        </div>
      </footer>

      {/* Character panel modal */}
      {showCharacterPanel && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCharacterPanel(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-scale-in relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Particle effect */}
            <ParticleSystem type="magic" intensity="low" className="absolute inset-0 rounded-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t('game.character_panel_title', lang)}</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCharacterPanel(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Character header */}
              <div className="text-center mb-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full blur-lg opacity-50 animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">{player.character.name}</h3>
                <p className="text-slate-400">{player.character.title}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <NeonText color="amber">Level {player.character.level}</NeonText>
                  <span className="text-slate-500">•</span>
                  <span className="text-violet-400">{player.character.origin}</span>
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
                  {t('game.stats_heading', lang)}
                </h4>
                {[
                  {
                    key: 'strength',
                    name: t('game.attr_strength', lang),
                    icon: Sword,
                    value: player.character.attributes.strength
                  },
                  {
                    key: 'intelligence',
                    name: t('game.attr_intelligence', lang),
                    icon: Brain,
                    value: player.character.attributes.intelligence
                  },
                  {
                    key: 'charisma',
                    name: t('game.attr_charisma', lang),
                    icon: Heart,
                    value: player.character.attributes.charisma
                  },
                  {
                    key: 'agility',
                    name: t('game.attr_agility', lang),
                    icon: Zap,
                    value: player.character.attributes.agility
                  },
                  {
                    key: 'wisdom',
                    name: t('game.attr_wisdom', lang),
                    icon: Eye,
                    value: player.character.attributes.wisdom
                  },
                  {
                    key: 'luck',
                    name: t('game.attr_luck', lang),
                    icon: Sparkles,
                    value: player.character.attributes.luck
                  }
                ].map((attr) => (
                  <div key={attr.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <attr.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{attr.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                          style={{ width: `${(attr.value / 20) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-violet-400 w-6">{attr.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
                  {t('game.personality_heading', lang)}
                </h4>
                {([
                  { key: 'brave', label: t('game.trait_brave', lang) },
                  { key: 'cunning', label: t('game.trait_cunning', lang) },
                  { key: 'kind', label: t('game.trait_kind', lang) },
                  { key: 'ruthless', label: t('game.trait_ruthless', lang) },
                  { key: 'honorable', label: t('game.trait_honorable', lang) },
                  { key: 'mysterious', label: t('game.trait_mysterious', lang) }
                ] as const).map((trait) => {
                  const value = player.character.personality[trait.key] ?? 0;
                  return (
                    <div key={trait.key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{trait.label}</span>
                        <span className="text-slate-400">{value}%</span>
                      </div>
                      <AnimatedStatBar value={value} max={100} color="violet" animated={false} />
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-400">{player.stats.battlesWon}</p>
                    <p className="text-xs text-slate-500">{t('game.stat_wins', lang)}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-fuchsia-400">{player.storyProgress.metNPCs.length}</p>
                    <p className="text-xs text-slate-500">{t('game.stat_allies', lang)}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-400">{player.storyProgress.completedQuests.length}</p>
                    <p className="text-xs text-slate-500">{t('game.stat_quests_done', lang)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tacticalMapOpen && (
        <WorldTacticalMapOverlay
          open={tacticalMapOpen}
          onClose={() => setTacticalMapOpen(false)}
          worldSeed={worldSeed}
          playerTileX={worldPosition.tileX}
          playerTileY={worldPosition.tileY}
          timeHour={player.storyProgress.worldState.time.hour}
          weather={player.storyProgress.worldState.weather}
          npcs={worldMapNpcs}
          locations={locations}
          discoveredLocations={player.storyProgress.discoveredLocations}
          currentLocation={currentLocation}
          onTravel={(id) => {
            handleTravel(id);
            setTacticalMapOpen(false);
          }}
          enemyCoalitions={player.storyProgress.enemyCoalitions ?? []}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {import.meta.env.DEV && <CombatQuestEligibilityDevPanel npcs={npcs} lang={lang} />}
    </div>
  );
}
