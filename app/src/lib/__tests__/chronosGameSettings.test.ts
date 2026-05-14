import { describe, expect, it, beforeEach } from 'vitest';
import {
  CHRONOS_SETTINGS_STORAGE_KEY,
  DEFAULT_CHRONOS_GAME_SETTINGS,
  getSoundSettingsPatch,
  loadChronosGameSettings,
} from '@/lib/chronosGameSettings';

describe('chronosGameSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadChronosGameSettings merges partial JSON over defaults', () => {
    localStorage.setItem(
      CHRONOS_SETTINGS_STORAGE_KEY,
      JSON.stringify({ masterVolume: 0.11, language: 'en' }),
    );
    const g = loadChronosGameSettings();
    expect(g.masterVolume).toBe(0.11);
    expect(g.language).toBe('en');
    expect(g.sfxVolume).toBe(DEFAULT_CHRONOS_GAME_SETTINGS.sfxVolume);
  });

  it('getSoundSettingsPatch maps audio fields', () => {
    const g = loadChronosGameSettings();
    const p = getSoundSettingsPatch(g);
    expect(p.masterVolume).toBe(g.masterVolume);
    expect(Object.keys(p).sort()).toEqual(
      ['masterVolume', 'musicEnabled', 'musicVolume', 'muted', 'sfxVolume'].sort(),
    );
  });

  it('defaults keep browser notifications opt-in off', () => {
    expect(DEFAULT_CHRONOS_GAME_SETTINGS.notifications).toBe(false);
  });
});
