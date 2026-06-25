// Accessibility Engine - Full a11y support for AAA game

export type AccessibilityMode =
  | 'none' | 'visual' | 'audio' | 'full';

export interface AccessibilitySettings {
  mode: AccessibilityMode;
  // Visual
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion: boolean;
  screenReaderHints: boolean;
  // Audio
  subtitles: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  audioDescriptions: boolean;
  signLanguage: boolean;
  // Input
  holdDuration: number; // ms for hold-toconfirm
  doubleTapInterval: number; // ms for double-tap
  aimAssist: boolean;
  // Gameplay
  autoPickup: boolean;
  autoLoot: boolean;
  softLockout: boolean;
  skipPuzzles: boolean;
  timeScale: number; // slow motion multiplier
}

// Default accessibility settings
const DEFAULT_SETTINGS: AccessibilitySettings = {
  mode: 'none',
  highContrast: false,
  colorBlindMode: 'none',
  fontSize: 'medium',
  reducedMotion: false,
  screenReaderHints: false,
  subtitles: true,
  subtitleSize: 'medium',
  audioDescriptions: false,
  signLanguage: false,
  holdDuration: 200,
  doubleTapInterval: 300,
  aimAssist: false,
  autoPickup: false,
  autoLoot: false,
  softLockout: true,
  skipPuzzles: false,
  timeScale: 1,
};

const STORAGE_KEY = 'chronos_accessibility';

// Persist settings
class AccessibilityEngine {
  private settings: AccessibilitySettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<(settings: AccessibilitySettings) => void> = new Set();
  private isLoaded = false;

  // Load settings
  load(): AccessibilitySettings {
    if (this.isLoaded) return this.settings;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }

    this.isLoaded = true;
    return this.settings;
  }

  // Save settings
  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      console.warn('[Accessibility] Failed to save settings');
    }
  }

  // Get current settings
  getSettings(): AccessibilitySettings {
    if (!this.isLoaded) this.load();
    return this.settings;
  }

  // Update settings (merge)
  update(partial: Partial<AccessibilitySettings>): AccessibilitySettings {
    this.settings = { ...this.settings, ...partial };
    this.save();
    this.notifyListeners();
    return this.settings;
  }

  // Reset to defaults
  reset(): AccessibilitySettings {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
    this.notifyListeners();
    return this.settings;
  }

  // Subscribe to changes
  subscribe(listener: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.settings);
      } catch {
        // Ignore listener errors
      }
    }
  }

  // Quick check methods
  isHighContrast(): boolean {
    return this.settings.highContrast;
  }

  isReducedMotion(): boolean {
    return this.settings.reducedMotion;
  }

  isScreenReaderMode(): boolean {
    return this.settings.screenReaderHints;
  }

  hasSubtitles(): boolean {
    return this.settings.subtitles;
  }

  getFontSize(): number {
    const sizes = { small: 12, medium: 14, large: 18, xlarge: 22 };
    return sizes[this.settings.fontSize];
  }

  getSubtitleSize(): number {
    const sizes = { small: 16, medium: 20, large: 28 };
    return sizes[this.settings.subtitleSize];
  }

  // Get CSS variables for accessibility
  getCSSVariables(): Record<string, string> {
    const settings = this.getSettings();

    return {
      '--a11y-font-size': `${this.getFontSize()}px`,
      '--a11y-subtitle-size': `${this.getSubtitleSize()}px`,
      '--a11y-high-contrast': settings.highContrast ? '1' : '0',
      '--a11y-reduced-motion': settings.reducedMotion ? '1' : '0',
      '--a11y-time-scale': String(settings.timeScale),
    };
  }

  // Get color filter for color blindness
  getColorBlindFilter(): string {
    const mode = this.settings.colorBlindMode;
    if (mode === 'none') return 'none';

    // CSS filters for color blindness simulation
    const filters: Record<string, string> = {
      protanopia: 'url(#protanopia)',
      deuteranopia: 'url(#deuteranopia)',
      tritanopia: 'url(#tritanopia)',
    };

    return filters[mode] ?? 'none';
  }

  // Get color blindness SVG filter definitions for injection into DOM
  getColorBlindSVGDefs(): string {
    const mode = this.settings.colorBlindMode;
    if (mode === 'none') return '';

    // SVG filter matrices for different types of color blindness
    const defs: Record<string, string> = {
      protanopia: `<filter id="protanopia"><feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/></filter>`,
      deuteranopia: `<filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/></filter>`,
      tritanopia: `<filter id="tritanopia"><feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/></filter>`,
    };

    return defs[mode] ?? '';
  }
}

// Singleton
export const accessibilityEngine = new AccessibilityEngine();

export default accessibilityEngine;