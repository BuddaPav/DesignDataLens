/**
 * Единый источник дефолтов и чтения `chronos_settings` (аудио/UI/графика).
 * Звуковой движок синхронизируется через `getSoundSettingsPatch` при старте и после сохранения настроек.
 */
import type { WorldGraphicsTier, ColorGradingPreset } from '@/types/chronosGraphics';

export const CHRONOS_SETTINGS_STORAGE_KEY = 'chronos_settings';

export interface ChronosGameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  musicEnabled: boolean;
  particleEffects: boolean;
  highQualityGraphics: boolean;
  screenShake: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  autoSave: boolean;
  notifications: boolean;
  hapticFeedback: boolean;
  proceduralDialogsOnly: boolean;
  /** Фоновая загрузка весов WebLLM после входа в игру (если выключено — только процедурные ответы до смены настройки). */
  webLlmAutoload: boolean;
  worldGraphicsTier: WorldGraphicsTier;
  /** Оверлей FPS/GPU (Three.js Stats) в 3D-мире — для отладки производительности. */
  showFpsOverlay: boolean;
  language: string;
  /** Игровой сложность: easy = проще враги и больше наград, hard = сложнее враги */
  gameDifficulty: 'easy' | 'normal' | 'hard';
  /** Чувствительность мыши (0.1 - 2.0) */
  mouseSensitivity: number;
  /** Инвертировать ось Y */
  invertMouseY: boolean;
  /** Режим камеры: first или third person */
  cameraMode: 'first' | 'third';
  /** Color grading: default / cinematic / vibrant / desaturated */
  colorGrading: ColorGradingPreset;
}

export type ChronosGraphicsProfile = 'performance' | 'balanced' | 'cinematic';

export const DEFAULT_CHRONOS_GAME_SETTINGS: ChronosGameSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  muted: false,
  musicEnabled: true,
  particleEffects: true,
  highQualityGraphics: true,
  screenShake: true,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  colorBlindMode: 'none',
  autoSave: true,
  notifications: false,
  hapticFeedback: true,
  proceduralDialogsOnly: false,
  webLlmAutoload: true,
  worldGraphicsTier: 'balanced',
  showFpsOverlay: false,
  language: 'ru',
  gameDifficulty: 'normal',
  mouseSensitivity: 1.0,
  invertMouseY: false,
  cameraMode: 'third',
  colorGrading: 'default',
};

export function loadChronosGameSettings(): ChronosGameSettings {
  try {
    const saved = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
    if (!saved) return DEFAULT_CHRONOS_GAME_SETTINGS;
    return { ...DEFAULT_CHRONOS_GAME_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_CHRONOS_GAME_SETTINGS;
  }
}

export function saveChronosGameSettings(next: ChronosGameSettings): void {
  localStorage.setItem(CHRONOS_SETTINGS_STORAGE_KEY, JSON.stringify(next));
}

export function detectGraphicsProfile(settings: ChronosGameSettings): ChronosGraphicsProfile {
  if (!settings.highQualityGraphics || settings.worldGraphicsTier === 'low') return 'performance';
  if (settings.worldGraphicsTier === 'high') return 'cinematic';
  return 'balanced';
}

export function applyGraphicsProfile(
  settings: ChronosGameSettings,
  profile: ChronosGraphicsProfile
): ChronosGameSettings {
  if (profile === 'performance') {
    return {
      ...settings,
      highQualityGraphics: false,
      worldGraphicsTier: 'low',
      particleEffects: false,
      reducedMotion: true,
      showFpsOverlay: false,
    };
  }
  if (profile === 'cinematic') {
    return {
      ...settings,
      highQualityGraphics: true,
      worldGraphicsTier: 'high',
      particleEffects: true,
      reducedMotion: false,
    };
  }
  return {
    ...settings,
    highQualityGraphics: true,
    worldGraphicsTier: 'balanced',
    particleEffects: true,
  };
}

/** Патч для SoundManager — те же поля, что и в `chronos_sound_settings` legacy. */
export function getSoundSettingsPatch(g: ChronosGameSettings): {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  musicEnabled: boolean;
} {
  return {
    masterVolume: g.masterVolume,
    sfxVolume: g.sfxVolume,
    musicVolume: g.musicVolume,
    muted: g.muted,
    musicEnabled: g.musicEnabled,
  };
}
