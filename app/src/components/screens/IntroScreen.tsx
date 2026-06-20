// Intro Screen - Enhanced First Impression

import { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  Clock,
  ChevronRight,
  Sparkle,
  Gamepad2,
  Brain,
  Infinity as InfinityIcon,
  MapPin,
  Sword,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParticleSystem } from '@/components/effects/ParticleSystem';
import { TiltCard, ScrambleText, NeonText } from '@/components/effects/VisualEffects';
import { soundManager } from '@/engine/SoundManager';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';
import { APP_VERSION } from '@/version';
import { toast } from 'sonner';
import { loadFullWorldFromIndexedDB } from '@/engine/saveSystem';
import {
  chronosGeneratedManifestUrl,
  chronosGraphicsUrl,
  chronosSplashDefaultUrl,
} from '@/domain/assets/chronosGraphicsRegistry';
import {
  CHRONOS_BROWSER_NOTIFY_TAGS,
  notifyGameBrowserEvent,
} from '@/domain/notifications/browserNotifications';
import {
  applyGraphicsProfile,
  detectGraphicsProfile,
  loadChronosGameSettings,
  saveChronosGameSettings,
  type ChronosGraphicsProfile,
} from '@/lib/chronosGameSettings';

const NAME_SUGGESTIONS = {
  ru: ['Артемис', 'Соларис', 'Луна', 'Феникс', 'Орион', 'Астра'],
  en: ['Artemis', 'Solaris', 'Luna', 'Phoenix', 'Orion', 'Astra']
} as const;

interface SaveMetadata {
  playerName: string;
  locationId: string;
  playedTime: number;
  inCombat: boolean;
  timestamp: number;
}

interface IntroScreenProps {
  onStart: (name: string) => void;
  onLoad: () => boolean;
  /** Если задано — при «Продолжить» пробуем IndexedDB после повреждённого localStorage (MVP 058). */
  onLoadWithRecovery?: () => Promise<{
    ok: boolean;
    recoveredFromIndexedDb?: boolean;
    unsupportedSchema?: boolean;
  }>;
  saveLoadError?: string | null;
  onClearSaveLoadError?: () => void;
  onDeleteSave?: () => void | Promise<void>;
  getSaveMetadata?: () => SaveMetadata | null;
}

export function IntroScreen({
  onStart,
  onLoad,
  onLoadWithRecovery,
  saveLoadError,
  onClearSaveLoadError,
  onDeleteSave,
  getSaveMetadata,
}: IntroScreenProps) {
  const language = useLanguage();
  const [step, setStep] = useState<'title' | 'name'>('title');
  const [playerName, setPlayerName] = useState('');
  const [hasSave, setHasSave] = useState(false);
  const [hasIndexedBackup, setHasIndexedBackup] = useState(false);
  const [showParticles] = useState(true);
  const [splashUrl, setSplashUrl] = useState(() => chronosSplashDefaultUrl());
  const [graphicsProfile, setGraphicsProfile] = useState<ChronosGraphicsProfile>(() =>
    detectGraphicsProfile(loadChronosGameSettings())
  );
  const [saveMetadata, setSaveMetadata] = useState<SaveMetadata | null>(null);

  useEffect(() => {
    const save = localStorage.getItem('chronos_save');
    setHasSave(!!save);
    if (getSaveMetadata) {
      setSaveMetadata(getSaveMetadata());
    }
    void loadFullWorldFromIndexedDB().then((raw) => setHasIndexedBackup(raw != null && typeof raw === 'object'));
  }, [getSaveMetadata]);

  /** Format played time as H:MM:SS */
  const formatPlayedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /** Format timestamp as locale date/time */
  const formatTimestamp = (ts: number): string => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** Опциональный фон из `npm run generate:ai-art` (manifest + backdrop.png в generated/) */
  useEffect(() => {
    const manifestUrl = chronosGeneratedManifestUrl();
    fetch(manifestUrl, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m: { backdrop?: string } | null) => {
        if (m?.backdrop) {
          setSplashUrl(`${chronosGraphicsUrl(`generated/${m.backdrop}`)}?v=${Date.now()}`);
        }
      })
      .catch(() => {});
  }, []);

  const handleStart = () => {
    if (playerName.trim()) {
      soundManager.play('success');
      onStart(playerName.trim());
    }
  };

  const handleLoad = async () => {
    soundManager.play('click');
    if (onLoadWithRecovery) {
      const result = await onLoadWithRecovery();
      if (result.ok && result.recoveredFromIndexedDb) {
        const recTitle = t('app.save_recovered_from_idb_title', language);
        const recDesc = t('app.save_recovered_from_idb_desc', language);
        toast.success(recTitle, {
          description: recDesc,
        });
        notifyGameBrowserEvent({
          tag: CHRONOS_BROWSER_NOTIFY_TAGS.saveRecovered,
          title: recTitle,
          body: recDesc,
        });
      }
      if (!result.ok) {
        setHasSave(!!localStorage.getItem('chronos_save'));
        void loadFullWorldFromIndexedDB().then((raw) =>
          setHasIndexedBackup(raw != null && typeof raw === 'object'),
        );
      }
      return;
    }
    const success = onLoad();
    if (!success) {
      setHasSave(false);
    }
  };

  const handleStepChange = (newStep: 'title' | 'name') => {
    soundManager.play('click');
    setStep(newStep);
  };

  const handleDeleteSave = async () => {
    if (!onDeleteSave) return;
    await onDeleteSave();
    setHasSave(!!localStorage.getItem('chronos_save'));
    void loadFullWorldFromIndexedDB().then((raw) =>
      setHasIndexedBackup(raw != null && typeof raw === 'object'),
    );
  };

  const applyProfile = (profile: ChronosGraphicsProfile) => {
    const current = loadChronosGameSettings();
    const next = applyGraphicsProfile(current, profile);
    saveChronosGameSettings(next);
    setGraphicsProfile(profile);
    window.dispatchEvent(new Event('chronos:settings_updated'));
    soundManager.play('click');
    const title =
      profile === 'performance'
        ? language === 'ru'
          ? 'Профиль: Производительность'
          : 'Profile: Performance'
        : profile === 'cinematic'
          ? language === 'ru'
            ? 'Профиль: Кинематограф'
            : 'Profile: Cinematic'
          : language === 'ru'
            ? 'Профиль: Сбалансированный'
            : 'Profile: Balanced';
    toast.success(title);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden isolate">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${splashUrl}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0B0C10]/92 via-[#0B0C10]/78 to-[#0B0C10]/94"
        aria-hidden
      />
      {/* Background particles (canvas uses mix-blend-mode; keep UI in a higher z-layer) */}
      {showParticles && (
        <ParticleSystem 
          type="magic" 
          intensity="medium" 
          className="z-[2]"
        />
      )}

      {/* Floating orbs decoration */}
      <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
        <div 
          className="absolute w-64 h-64 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animation: 'float-1 15s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />
        <div 
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(217, 70, 239, 0.5) 0%, transparent 70%)',
            bottom: '15%',
            right: '10%',
            animation: 'float-2 20s ease-in-out infinite',
            filter: 'blur(60px)'
          }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%)',
            top: '50%',
            right: '20%',
            animation: 'float-3 12s ease-in-out infinite',
            filter: 'blur(30px)'
          }}
        />
      </div>

      {step === 'title' && (
        <div className="text-center max-w-2xl animate-fade-in relative z-20">
          {/* Logo */}
          <TiltCard className="mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                {/* Outer glow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl rotate-45 animate-pulse"
                  style={{ filter: 'blur(20px)', opacity: 0.5 }}
                />
                {/* Main shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl rotate-45" />
                {/* Inner shape */}
                <div className="absolute inset-3 bg-slate-950 rounded-3xl rotate-45" />
                {/* Icon */}
                <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-violet-400 animate-pulse" />
                {/* Sparkle decorations */}
                <Sparkle className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
                <Sparkle className="absolute -bottom-2 -left-2 w-4 h-4 text-fuchsia-400 animate-bounce" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </TiltCard>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-4">
            <NeonText color="violet" className="tracking-tight">
              <ScrambleText text="Chronos" trigger={true} />
            </NeonText>
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-400/95 mb-2 font-light tracking-wide">
            {t('intro.subtitle_brand', language)}
          </p>

          <p className="text-slate-500 mb-12 max-w-lg mx-auto text-base sm:text-lg leading-relaxed">
            {t('intro.tagline', language)}{' '}
            <span className="text-[var(--chronos-primary-hex)]/95 font-medium">
              {t('intro.tagline_highlight', language)}
            </span>
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <TiltCard>
              <Button
                data-testid="intro-start-story"
                onClick={() => handleStepChange('name')}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-10 py-7 text-lg font-semibold shadow-lg shadow-violet-500/25 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <Sparkle className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">{t('intro.start_story', language)}</span>
              </Button>
            </TiltCard>
            
            {(hasSave || hasIndexedBackup) && (
              <TiltCard>
                <div className="flex flex-col gap-3">
                  <Button
                    data-testid="intro-continue"
                    onClick={() => void handleLoad()}
                    variant="outline"
                    size="lg"
                    className="border-slate-700 hover:bg-slate-800 text-slate-300 px-10 py-7 text-lg relative overflow-hidden group"
                  >
                    <Clock className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    {t('intro.continue', language)}
                  </Button>

                  {/* Save metadata display */}
                  {saveMetadata && (
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                      {/* Player name */}
                      <span className="text-amber-400 font-medium">
                        {saveMetadata.playerName}
                      </span>

                      {/* Location */}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {saveMetadata.locationId}
                      </span>

                      {/* Played time */}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatPlayedTime(saveMetadata.playedTime)}
                      </span>

                      {/* Combat status */}
                      {saveMetadata.inCombat ? (
                        <span className="flex items-center gap-1 text-rose-400">
                          <Sword className="w-3 h-3" />
                          {language === 'ru' ? 'В бою' : 'In combat'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Shield className="w-3 h-3" />
                          {language === 'ru' ? 'Безопасно' : 'Safe'}
                        </span>
                      )}

                      {/* Last saved */}
                      <span className="text-slate-500">
                        {formatTimestamp(saveMetadata.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
              </TiltCard>
            )}
          </div>

          {saveLoadError && (
            <div
              role="alert"
              className="mt-6 max-w-lg mx-auto rounded-lg border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-left text-sm text-rose-100/95"
            >
              <p className="mb-3">{saveLoadError}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {(hasSave || hasIndexedBackup || onLoadWithRecovery) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-400/40 text-rose-50 hover:bg-rose-950/80"
                    onClick={() => void handleLoad()}
                  >
                    {language === 'ru' ? 'Повторить загрузку' : 'Retry load'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-rose-400/40 text-rose-50 hover:bg-rose-950/80"
                  onClick={() => {
                    onClearSaveLoadError?.();
                    setStep('name');
                  }}
                >
                  {language === 'ru' ? 'Новая игра' : 'New game'}
                </Button>
                {onClearSaveLoadError && (
                  <Button type="button" variant="ghost" size="sm" className="text-rose-200/90" onClick={onClearSaveLoadError}>
                    {language === 'ru' ? 'Скрыть' : 'Dismiss'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {import.meta.env.DEV && onDeleteSave && (
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-amber-200/90"
                onClick={() => void handleDeleteSave()}
              >
                {t('app.delete_save_dev', language)}
              </Button>
            </div>
          )}

          {/* Feature preview */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <TiltCard className="rounded-xl border border-white/[0.08] bg-black/25 backdrop-blur-sm p-5 shadow-lg shadow-black/20 ring-1 ring-white/[0.03]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center ring-1 ring-violet-400/25">
                  <Brain className="w-6 h-6 text-violet-300" />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-[var(--chronos-text)]">
                    {t('intro.feature_ai_title', language)}
                  </p>
                  <p className="text-sm text-[var(--chronos-text-secondary)]">{t('intro.feature_ai_sub', language)}</p>
                </div>
              </div>
            </TiltCard>

            <TiltCard className="rounded-xl border border-white/[0.08] bg-black/25 backdrop-blur-sm p-5 shadow-lg shadow-black/20 ring-1 ring-white/[0.03]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center ring-1 ring-fuchsia-400/25">
                  <User className="w-6 h-6 text-fuchsia-300" />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-[var(--chronos-text)]">
                    {t('intro.feature_npc_title', language)}
                  </p>
                  <p className="text-sm text-[var(--chronos-text-secondary)]">{t('intro.feature_npc_sub', language)}</p>
                </div>
              </div>
            </TiltCard>

            <TiltCard className="rounded-xl border border-white/[0.08] bg-black/25 backdrop-blur-sm p-5 shadow-lg shadow-black/20 ring-1 ring-white/[0.03]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-400/25">
                  <InfinityIcon className="w-6 h-6 text-amber-300" />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-[var(--chronos-text)]">
                    {t('intro.feature_inf_title', language)}
                  </p>
                  <p className="text-sm text-[var(--chronos-text-secondary)]">{t('intro.feature_inf_sub', language)}</p>
                </div>
              </div>
            </TiltCard>
          </div>

          <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/35 p-4 backdrop-blur-sm">
            <p className="text-sm text-slate-300 mb-3">
              {language === 'ru' ? 'Графический профиль (до старта игры)' : 'Graphics profile (before start)'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                { id: 'performance', ru: 'Производительность', en: 'Performance' },
                { id: 'balanced', ru: 'Сбалансированный', en: 'Balanced' },
                { id: 'cinematic', ru: 'Кинематограф', en: 'Cinematic' },
              ] as const).map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant={graphicsProfile === p.id ? 'secondary' : 'outline'}
                  className={
                    graphicsProfile === p.id
                      ? 'bg-violet-600/35 border-violet-400/55 text-violet-100'
                      : 'border-slate-700 text-slate-300'
                  }
                  onClick={() => applyProfile(p.id)}
                >
                  {language === 'ru' ? p.ru : p.en}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'name' && (
        <div className="text-center max-w-md w-full animate-fade-in relative z-20">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-slate-100">{t('intro.who_are_you', language)}</h2>
          <p className="text-slate-400 mb-8">{t('intro.your_name_hint', language)}</p>

          <div className="space-y-4">
            <Input
              data-testid="intro-player-name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('intro.name_placeholder', language)}
              maxLength={20}
              className="bg-slate-900/80 border-slate-700 text-center text-xl py-6 focus:border-violet-500 focus:ring-violet-500/20"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              autoFocus
              autoComplete="off"
              name="chronos-player-name"
            />

            <Button
              data-testid="intro-begin-adventure"
              onClick={handleStart}
              disabled={!playerName.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 py-6"
            >
              {t('intro.begin_adventure', language)}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={() => handleStepChange('title')}
              variant="ghost"
              className="w-full text-slate-500 hover:text-slate-300"
            >
              {t('intro.back', language)}
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-white/[0.08] bg-black/30 p-3">
            <p className="text-xs text-slate-400 mb-2">
              {language === 'ru' ? 'Профиль графики' : 'Graphics profile'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'performance', ru: 'FPS', en: 'FPS' },
                { id: 'balanced', ru: 'Баланс', en: 'Balanced' },
                { id: 'cinematic', ru: 'Кино', en: 'Cinematic' },
              ] as const).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyProfile(p.id)}
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    graphicsProfile === p.id
                      ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {language === 'ru' ? p.ru : p.en}
                </button>
              ))}
            </div>
          </div>

          {/* Name suggestions */}
          <div className="mt-8">
            <p className="text-sm text-slate-500 mb-3">{t('intro.suggested', language)}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {NAME_SUGGESTIONS[language].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setPlayerName(name);
                    soundManager.play('click');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium text-[var(--chronos-text)] bg-black/30 border border-white/[0.08] hover:border-[var(--chronos-primary-hex)]/40 hover:bg-[var(--chronos-surface)]/60 transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Decorative elements */}
      <div className="fixed bottom-6 left-6 z-20 text-[11px] text-[var(--chronos-text-disabled)] flex items-center gap-2 tracking-wide">
        <Gamepad2 className="w-4 h-4 text-[var(--chronos-text-secondary)]" />
        <span>{t('intro.footer_meta', language).replace('{{v}}', APP_VERSION)}</span>
      </div>

      <div className="fixed bottom-6 right-6 z-20 text-[11px] text-[var(--chronos-text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          {t('intro.offline_ready', language)}
        </span>
      </div>

      {/* Floating animations */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
      `}</style>
    </div>
  );
}
