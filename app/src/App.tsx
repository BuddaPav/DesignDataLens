// Chronos: AI Chronicles - Main Application (Enhanced Edition)

import { useState, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { IntroScreen } from '@/components/screens/IntroScreen';
import { CharacterCreation } from '@/components/screens/CharacterCreation';
import { GameScreen } from '@/components/screens/GameScreen';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { UpdateBanner } from '@/components/game/UpdateBanner';
import { useUpdateCheck } from '@/hooks/useUpdateCheck';
import { ParticleBurst } from '@/components/effects/ParticleSystem';
import { GradientMesh } from '@/components/effects/VisualEffects';
import { soundManager } from '@/engine/SoundManager';
import { getSoundSettingsPatch, loadChronosGameSettings } from '@/lib/chronosGameSettings';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Settings, Volume2, VolumeX, Music, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './App.css';
import { useLanguage } from '@/i18n/LanguageProvider';
import { getLanguage, t } from '@/i18n';
import {
  CHRONOS_BROWSER_NOTIFY_TAGS,
  notifyGameBrowserEvent,
} from '@/domain/notifications/browserNotifications';

/** Событие beforeinstallprompt (не все браузеры типизируют одинаково). */
type BeforeInstallPromptLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function App() {
  const lang = useLanguage();
  const game = useGameState();
  const [showLoading, setShowLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptLike | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { updateAvailable, remote, dismiss, currentVersion } = useUpdateCheck();

  useEffect(() => {
    const era = game.player?.character.worldEra ?? 'medieval';
    document.documentElement.setAttribute('data-era', era);
    return () => document.documentElement.removeAttribute('data-era');
  }, [game.player?.character.worldEra]);

  // Initialize PWA and service worker (не file:// — Electron без SW)
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      void navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptLike);
      setShowInstallBanner(true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      const L = getLanguage();
      toast.success(t('app.pwa_installed_title', L), {
        description: t('app.pwa_installed_desc', L)
      });
    });

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      const L = getLanguage();
      toast.success(t('app.online_restored', L));
    };
    const handleOffline = () => {
      setIsOnline(false);
      const L = getLanguage();
      toast.error(t('app.offline_title', L), {
        description: t('app.offline_desc', L)
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const applySoundFromGameSettings = () => {
      soundManager.setSettings(getSoundSettingsPatch(loadChronosGameSettings()));
      const s = soundManager.getSettings();
      setIsMuted(s.muted);
      setIsMusicEnabled(s.musicEnabled);
    };
    applySoundFromGameSettings();
    window.addEventListener('chronos:settings_updated', applySoundFromGameSettings);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('chronos:settings_updated', applySoundFromGameSettings);
    };
  }, []);

  // Handle loading states
  useEffect(() => {
    if (game.isGenerating) {
      setShowLoading(true);
    } else {
      const timer = setTimeout(() => setShowLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [game.isGenerating]);

  // Play level up sound when player levels up
  const playerId = game.player?.id;
  const playerLevel = game.player?.character.level;
  useEffect(() => {
    const p = game.player;
    if (p && p.character.level > 1) {
      const lastLevel = localStorage.getItem('chronos_last_level');
      if (lastLevel && parseInt(lastLevel) < p.character.level) {
        soundManager.play('levelUp');
        setShowParticleBurst(true);
        setTimeout(() => setShowParticleBurst(false), 2000);
        const levelTitle = t('app.level_up_title', lang).replace('{{n}}', String(p.character.level));
        const levelDesc = t('app.level_up_desc', lang);
        toast.success(levelTitle, {
          description: levelDesc
        });
        notifyGameBrowserEvent({
          tag: CHRONOS_BROWSER_NOTIFY_TAGS.levelUp,
          title: levelTitle,
          body: levelDesc,
        });
      }
      localStorage.setItem('chronos_last_level', p.character.level.toString());
    }
  }, [playerId, playerLevel, lang, game.player]);

  // Handle install prompt
  const handleInstall = async () => {
    if (!installPrompt) return;
    const L = getLanguage();
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success(t('app.install_started', L));
    }

    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
    toast.info(newMuted ? t('app.sound_muted', lang) : t('app.sound_unmuted', lang));
  };

  // Toggle music
  const toggleMusic = () => {
    const newMusicEnabled = soundManager.toggleMusic();
    setIsMusicEnabled(newMusicEnabled);
    if (newMusicEnabled) {
      soundManager.playMusic('main');
    }
    toast.info(newMusicEnabled ? t('app.music_on', lang) : t('app.music_off', lang));
  };

  useEffect(() => {
    const onFirstClick = () => {
      if (isMusicEnabled && !isMuted) {
        soundManager.playMusic('main');
      }
    };
    document.addEventListener('click', onFirstClick, { once: true });
    return () => document.removeEventListener('click', onFirstClick);
  }, [isMusicEnabled, isMuted]);

  // Render appropriate screen based on game phase
  const renderScreen = () => {
    switch (game.gamePhase) {
      case 'intro':
        return (
          <IntroScreen
            onStart={game.initializePlayer}
            onLoad={game.loadGame}
            onLoadWithRecovery={game.loadGameWithRecovery}
            saveLoadError={game.saveLoadError}
            onClearSaveLoadError={game.clearSaveLoadError}
            onDeleteSave={import.meta.env.DEV ? game.deleteLocalSave : undefined}
          />
        );
      
      case 'character_creation':
        return <CharacterCreation onComplete={game.finalizeCharacter} player={game.player} />;
      
      case 'playing':
        return (
          <GameScreen 
            player={game.player}
            currentLocation={game.currentLocation}
            currentScene={game.currentScene}
            currentQuest={game.currentQuest}
            npcs={game.npcsInLocation}
            worldMapNpcs={game.worldMapNpcs}
            worldPosition={game.worldPosition}
            worldSeed={game.worldSeed}
            updateWorldPosition={game.updateWorldPosition}
            locations={game.locations}
            shopItems={game.shopItems}
            onPurchaseShopItem={game.purchaseShopItem}
            lastError={game.lastError}
            worldEventLog={game.worldEventLog}
            onChoice={game.makeChoice}
            onTravel={game.travelTo}
            onNPCInteract={game.interactWithNPC}
            onContinueStory={() => void game.generateScene()}
            llmLoadProgress={game.llmLoadProgress}
            onGenerateQuest={game.generateQuest}
            onSave={game.saveGame}
            onAdvanceTime={game.advanceTime}
            isAdvancingTime={game.isAdvancingTime}
          />
        );
      
      default:
        return (
          <IntroScreen
            onStart={game.initializePlayer}
            onLoad={game.loadGame}
            onLoadWithRecovery={game.loadGameWithRecovery}
            saveLoadError={game.saveLoadError}
            onClearSaveLoadError={game.clearSaveLoadError}
            onDeleteSave={import.meta.env.DEV ? game.deleteLocalSave : undefined}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Enhanced background effects */}
      <GradientMesh />
      
      {/* Particle burst effect */}
      <ParticleBurst 
        trigger={showParticleBurst} 
        type="levelup" 
        onComplete={() => setShowParticleBurst(false)}
      />

      {/* Install banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 animate-slide-down">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎮</span>
              </div>
              <div>
                <p className="font-semibold">{t('app.install_banner_title', lang)}</p>
                <p className="text-sm text-white/80">{t('app.install_banner_sub', lang)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowInstallBanner(false)}
                className="text-white hover:bg-white/20"
              >
                {t('app.install_not_now', lang)}
              </Button>
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="bg-white text-violet-600 hover:bg-white/90"
              >
                {t('app.install_action', lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!updateAvailable && (
        <div className="fixed bottom-4 left-4 z-40 pointer-events-none">
          <span className="pointer-events-auto text-[10px] font-mono text-slate-500/90 bg-slate-950/70 px-2 py-1 rounded border border-white/5">
            Chronos v{currentVersion}
          </span>
        </div>
      )}

      {updateAvailable && remote && (
        <UpdateBanner currentVersion={currentVersion} remote={remote} onDismiss={dismiss} />
      )}

      {/* Top bar with controls */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Online status */}
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? t('app.status_online', lang) : t('app.status_offline', lang)}
        </div>

        {/* Sound controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="w-9 h-9 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800"
          aria-label={isMuted ? t('app.aria_sound_turn_on', lang) : t('app.aria_sound_turn_off', lang)}
          aria-pressed={isMuted}
        >
          {isMuted ? <VolumeX className="w-4 h-4" aria-hidden /> : <Volume2 className="w-4 h-4" aria-hidden />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMusic}
          className={`w-9 h-9 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800 ${
            isMusicEnabled ? 'text-fuchsia-400' : 'text-slate-500'
          }`}
          aria-label={
            isMusicEnabled ? t('app.aria_music_turn_off', lang) : t('app.aria_music_turn_on', lang)
          }
          aria-pressed={isMusicEnabled}
        >
          <Music className="w-4 h-4" aria-hidden />
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowSettings(true);
            soundManager.play('click');
          }}
          className="w-9 h-9 bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-800"
          aria-label={t('settings.title', lang)}
        >
          <Settings className="w-4 h-4" aria-hidden />
        </Button>
      </div>

      {/* Main content */}
      <main id="chronos-main" className="relative z-10 min-h-screen">
        {renderScreen()}
      </main>

      {/* Loading overlay */}
      {showLoading && <LoadingScreen />}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        visibleToasts={4}
        gap={10}
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#f8fafc'
          }
        }}
      />

      {/* Add slide-down animation */}
      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
