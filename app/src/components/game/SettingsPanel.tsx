// Settings Panel - Comprehensive game settings

import { useState, useEffect } from 'react';
import {
  Volume2, VolumeX, Music, Monitor, Smartphone, Map,
  Accessibility, Palette, Bell, Save,
  ChevronRight, RotateCcw, Check, Sparkles, Gauge, Brain,
  FlipHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { soundManager } from '@/engine/SoundManager';
import { clearChronosLlmDiskCache } from '@/engine/localAI';
import { APP_VERSION } from '@/version';
import { loadNavigation, saveNavigation } from '@/lib/navigationStorage';
import {
  CHRONOS_SETTINGS_STORAGE_KEY,
  DEFAULT_CHRONOS_GAME_SETTINGS,
  getSoundSettingsPatch,
  loadChronosGameSettings,
  type ChronosGameSettings,
} from '@/lib/chronosGameSettings';
import type { Language } from '@/i18n';
import { t } from '@/i18n';
import { toast } from 'sonner';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import { requestBrowserNotificationPermission } from '@/domain/notifications/browserNotifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChronosGameSettings>(() => loadChronosGameSettings());
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics' | 'accessibility' | 'gameplay'>('audio');
  const [hasChanges, setHasChanges] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(() => loadNavigation().settings.minimapEnabled);

  const lang: Language = settings.language === 'en' ? 'en' : 'ru';

  useEffect(() => {
    const sync = () => setMinimapEnabled(loadNavigation().settings.minimapEnabled);
    window.addEventListener('chronos:navigation_updated', sync);
    return () => window.removeEventListener('chronos:navigation_updated', sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const updateSetting = <K extends keyof ChronosGameSettings>(key: K, value: ChronosGameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);

    // Apply immediate changes
    if (key === 'masterVolume' || key === 'sfxVolume' || key === 'musicVolume' || key === 'muted' || key === 'musicEnabled') {
      const soundSettings: { masterVolume?: number; sfxVolume?: number; musicVolume?: number; muted?: boolean; musicEnabled?: boolean } = {};
      if (key === 'masterVolume') soundSettings.masterVolume = value as number;
      if (key === 'sfxVolume') soundSettings.sfxVolume = value as number;
      if (key === 'musicVolume') soundSettings.musicVolume = value as number;
      if (key === 'muted') soundSettings.muted = value as boolean;
      if (key === 'musicEnabled') soundSettings.musicEnabled = value as boolean;
      soundManager.setSettings(soundSettings);
    }

    if (key === 'reducedMotion') {
      document.documentElement.style.setProperty('--motion-duration', value ? '0.01ms' : '0.3s');
    }

    if (key === 'largeText') {
      document.documentElement.style.fontSize = value ? '18px' : '16px';
    }

    if (key === 'highContrast') {
      document.body.classList.toggle('high-contrast', value as boolean);
    }

    if (key === 'showFpsOverlay') {
      window.dispatchEvent(new CustomEvent('chronos:fps_overlay', { detail: value as boolean }));
    }
  };

  const saveSettings = () => {
    localStorage.setItem(CHRONOS_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    soundManager.setSettings(getSoundSettingsPatch(settings));
    window.dispatchEvent(new Event('chronos:settings_updated'));
    soundManager.play('save');
    setHasChanges(false);
  };

  const enableBrowserNotifications = async (): Promise<boolean> => {
    const r = await requestBrowserNotificationPermission();
    switch (r.kind) {
      case 'unsupported':
        toast.info(t('settings.notifications_unsupported', lang));
        return false;
      case 'blocked':
        toast.error(t('settings.notifications_blocked', lang));
        return false;
      case 'prompt_denied':
        toast.error(t('settings.notifications_denied', lang));
        return false;
      case 'granted':
        if (r.via === 'prompt') {
          toast.success(t('settings.notifications_granted', lang));
        }
        return true;
      default: {
        const _exhaustive: never = r;
        return _exhaustive;
      }
    }
  };

  const handleNotificationsToggle = async (checked: boolean) => {
    if (!checked) {
      updateSetting('notifications', false);
      soundManager.play('click');
      return;
    }
    const ok = await enableBrowserNotifications();
    if (ok) {
      updateSetting('notifications', true);
    }
    soundManager.play('click');
  };

  const resetSettings = () => {
    const next = { ...DEFAULT_CHRONOS_GAME_SETTINGS };
    setSettings(next);
    soundManager.setSettings(getSoundSettingsPatch(next));
    setHasChanges(true);
    clearChronosLlmDiskCache();
    soundManager.play('click');
  };

  const testSound = (type: Parameters<typeof soundManager.play>[0]) => {
    soundManager.play(type);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'audio' as const, label: t('settings.tab_audio', lang), icon: Volume2 },
    { id: 'graphics' as const, label: t('settings.tab_graphics', lang), icon: Monitor },
    { id: 'accessibility' as const, label: t('settings.tab_accessibility', lang), icon: Accessibility },
    { id: 'gameplay' as const, label: t('settings.tab_gameplay', lang), icon: Smartphone }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chronos-settings-title"
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 id="chronos-settings-title" className="text-2xl font-bold">
              {t('settings.title', lang)}
            </h2>
            <p className="text-sm text-slate-400">{t('settings.subtitle', lang)}</p>
            <p className="text-[11px] text-slate-600 font-mono mt-1">
              {t('settings.version_line', lang).replace('{{v}}', APP_VERSION)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="sr-only">{t('settings.close', lang)}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row h-[60vh]">
          {/* Sidebar */}
          <div className="w-full md:w-48 bg-slate-950/50 border-r border-slate-800 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  soundManager.play('click');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Audio Settings */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.muted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-violet-400" />}
                    <div>
                      <Label className="font-medium">{t('settings.sound', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.sound_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={!settings.muted}
                    onCheckedChange={(checked) => updateSetting('muted', !checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-fuchsia-400" />
                    <div>
                      <Label className="font-medium">{t('settings.music_toggle', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.music_bg_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.musicEnabled}
                    onCheckedChange={(checked) => updateSetting('musicEnabled', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{t('settings.master_volume', lang)}</Label>
                    <span className="text-sm text-slate-400">{Math.round(settings.masterVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.masterVolume * 100]}
                    onValueChange={([value]) => updateSetting('masterVolume', value / 100)}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{t('settings.sfx_volume', lang)}</Label>
                    <span className="text-sm text-slate-400">{Math.round(settings.sfxVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.sfxVolume * 100]}
                    onValueChange={([value]) => updateSetting('sfxVolume', value / 100)}
                    max={100}
                    step={5}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testSound('click')}>
                      {t('settings.test_click', lang)}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => testSound('success')}>
                      {t('settings.test_success', lang)}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => testSound('levelUp')}>
                      {t('settings.test_level', lang)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>{t('settings.music_volume', lang)}</Label>
                    <span className="text-sm text-slate-400">{Math.round(settings.musicVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.musicVolume * 100]}
                    onValueChange={([value]) => updateSetting('musicVolume', value / 100)}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )}

            {/* Graphics Settings */}
            {activeTab === 'graphics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-5 h-5 text-amber-400" />
                    <div>
                      <Label className="font-medium">{t('settings.particles', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.particles_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.particleEffects}
                    onCheckedChange={(checked) => updateSetting('particleEffects', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    <div>
                      <Label className="font-medium">{t('settings.hq_graphics', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.hq_graphics_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.highQualityGraphics}
                    onCheckedChange={(checked) => updateSetting('highQualityGraphics', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">{t('settings.world_graphics_tier', lang)}</Label>
                  <p className="text-sm text-slate-400">{t('settings.world_graphics_tier_desc', lang)}</p>
                  <Select
                    value={settings.worldGraphicsTier}
                    onValueChange={(v) => updateSetting('worldGraphicsTier', v as WorldGraphicsTier)}
                    disabled={!settings.highQualityGraphics}
                  >
                    <SelectTrigger className="w-full max-w-md border-slate-700 bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('settings.world_graphics_low', lang)}</SelectItem>
                      <SelectItem value="balanced">{t('settings.world_graphics_balanced', lang)}</SelectItem>
                      <SelectItem value="high">{t('settings.world_graphics_high', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <div>
                      <Label className="font-medium">{t('settings.fps_overlay', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.fps_overlay_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.showFpsOverlay}
                    onCheckedChange={(checked) => updateSetting('showFpsOverlay', checked)}
                    disabled={!settings.highQualityGraphics}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ZapIcon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <Label className="font-medium">{t('settings.screen_shake', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.screen_shake_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.screenShake}
                    onCheckedChange={(checked) => updateSetting('screenShake', checked)}
                  />
                </div>

                {/* Camera Mode */}
                <div className="space-y-2">
                  <Label className="font-medium">{t('settings.camera_mode', lang)}</Label>
                  <p className="text-sm text-slate-400">{t('settings.camera_mode_desc', lang)}</p>
                  <Select
                    value={settings.cameraMode}
                    onValueChange={(v) => updateSetting('cameraMode', v as 'first' | 'third')}
                  >
                    <SelectTrigger className="w-full max-w-md border-slate-700 bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">{t('settings.camera_first', lang)}</SelectItem>
                      <SelectItem value="third">{t('settings.camera_third', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mouse Sensitivity */}
                <div className="space-y-2">
                  <Label className="font-medium">{t('settings.mouse_sensitivity', lang)}</Label>
                  <p className="text-sm text-slate-400">{t('settings.mouse_sensitivity_desc', lang)}</p>
                  <Slider
                    value={[settings.mouseSensitivity * 100]}
                    onValueChange={([v]) => updateSetting('mouseSensitivity', v / 100)}
                    min={10}
                    max={200}
                    step={10}
                    className="max-w-md"
                  />
                  <p className="text-xs text-slate-500">{settings.mouseSensitivity.toFixed(1)}x</p>
                </div>

                {/* Invert Y */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlipHorizontal className="w-5 h-5 text-teal-400" />
                    <div>
                      <Label className="font-medium">{t('settings.invert_y', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.invert_y_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.invertMouseY}
                    onCheckedChange={(checked) => updateSetting('invertMouseY', checked)}
                  />
                </div>

                {/* Color Grading */}
                <div className="space-y-2">
                  <Label className="font-medium">{t('settings.color_grading', lang)}</Label>
                  <p className="text-sm text-slate-400">{t('settings.color_grading_desc', lang)}</p>
                  <Select
                    value={settings.colorGrading}
                    onValueChange={(v) => updateSetting('colorGrading', v as 'default' | 'cinematic' | 'vibrant' | 'desaturated')}
                  >
                    <SelectTrigger className="w-full max-w-md border-slate-700 bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">{t('settings.color_default', lang)}</SelectItem>
                      <SelectItem value="cinematic">{t('settings.color_cinematic', lang)}</SelectItem>
                      <SelectItem value="vibrant">{t('settings.color_vibrant', lang)}</SelectItem>
                      <SelectItem value="desaturated">{t('settings.color_desaturated', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Accessibility Settings */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-green-400" />
                    <div>
                      <Label className="font-medium">{t('settings.reduced_motion', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.reduced_motion_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label className="font-medium">{t('settings.high_contrast', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.high_contrast_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TypeIcon className="w-5 h-5 text-cyan-400" />
                    <div>
                      <Label className="font-medium">{t('settings.large_text', lang)}</Label>
                      <p className="text-sm text-slate-400">{t('settings.large_text_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.largeText}
                    onCheckedChange={(checked) => updateSetting('largeText', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t('settings.colorblind_mode', lang)}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => updateSetting('colorBlindMode', mode)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          settings.colorBlindMode === mode
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {mode === 'none' && t('settings.cb_none', lang)}
                        {mode === 'protanopia' && t('settings.cb_protanopia', lang)}
                        {mode === 'deuteranopia' && t('settings.cb_deuteranopia', lang)}
                        {mode === 'tritanopia' && t('settings.cb_tritanopia', lang)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gameplay Settings */}
            {activeTab === 'gameplay' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Save className="w-5 h-5 text-emerald-400" />
                    <div>
                      <Label htmlFor="chronos-switch-autosave" className="font-medium">
                        {t('settings.autosave', lang)}
                      </Label>
                      <p className="text-sm text-slate-400">{t('settings.autosave_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    id="chronos-switch-autosave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-rose-400" />
                    <div>
                      <Label htmlFor="chronos-switch-notifications" className="font-medium">
                        {t('settings.notifications', lang)}
                      </Label>
                      <p id="chronos-switch-notifications-desc" className="text-sm text-slate-400">
                        {t('settings.notifications_desc', lang)}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="chronos-switch-notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => void handleNotificationsToggle(checked)}
                    aria-describedby="chronos-switch-notifications-desc"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    <div>
                      <Label htmlFor="chronos-switch-haptic" className="font-medium">
                        {t('settings.haptic', lang)}
                      </Label>
                      <p className="text-sm text-slate-400">{t('settings.haptic_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch 
                    id="chronos-switch-haptic"
                    checked={settings.hapticFeedback}
                    onCheckedChange={(checked) => updateSetting('hapticFeedback', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-cyan-400" />
                    <div>
                      <Label htmlFor="chronos-switch-minimap" className="font-medium">
                        {t('settings.minimap_corner', lang)}
                      </Label>
                      <p className="text-sm text-slate-400">{t('settings.minimap_corner_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch
                    id="chronos-switch-minimap"
                    checked={minimapEnabled}
                    onCheckedChange={(checked) => {
                      const n = loadNavigation();
                      saveNavigation({
                        ...n,
                        settings: { ...n.settings, minimapEnabled: checked }
                      });
                      setMinimapEnabled(checked);
                      soundManager.play('click');
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <div>
                      <Label htmlFor="chronos-switch-procedural-dialogs" className="font-medium">
                        {t('settings.procedural_dialogs', lang)}
                      </Label>
                      <p className="text-sm text-slate-400">{t('settings.procedural_dialogs_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch
                    id="chronos-switch-procedural-dialogs"
                    checked={settings.proceduralDialogsOnly}
                    onCheckedChange={(checked) => updateSetting('proceduralDialogsOnly', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-fuchsia-400" />
                    <div>
                      <Label htmlFor="chronos-switch-webllm-autoload" className="font-medium">
                        {t('settings.web_llm_autoload', lang)}
                      </Label>
                      <p className="text-sm text-slate-400">{t('settings.web_llm_autoload_desc', lang)}</p>
                    </div>
                  </div>
                  <Switch
                    id="chronos-switch-webllm-autoload"
                    checked={settings.webLlmAutoload}
                    disabled={settings.proceduralDialogsOnly}
                    onCheckedChange={(checked) => updateSetting('webLlmAutoload', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t('settings.language', lang)}</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateSetting('language', 'ru')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.language === 'ru'
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t('settings.lang_ru', lang)}
                    </button>
                    <button
                      onClick={() => updateSetting('language', 'en')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.language === 'en'
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t('settings.lang_en', lang)}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>{t('settings.difficulty', lang)}</Label>
                  <div className="flex gap-2">
                    {(['easy', 'normal', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => updateSetting('gameDifficulty', diff)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          settings.gameDifficulty === diff
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {t(`settings.difficulty_${diff}`, lang)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {t(`settings.difficulty_hint_${settings.gameDifficulty}`, lang)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-950/30">
          <Button variant="outline" onClick={resetSettings} className="text-slate-400">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('settings.reset', lang)}
          </Button>
          <Button 
            onClick={saveSettings}
            className={`transition-all ${hasChanges ? 'bg-violet-600 hover:bg-violet-500' : ''}`}
          >
            {hasChanges ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('settings.save_changes', lang)}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('settings.saved', lang)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icon components
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function TypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}
