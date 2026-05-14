import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import { CHRONOS_SETTINGS_STORAGE_KEY } from '@/lib/chronosGameSettings';

export function readWorldGraphicsTier(): WorldGraphicsTier {
  try {
    const raw = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
    if (!raw) return 'balanced';
    const j = JSON.parse(raw) as { worldGraphicsTier?: string };
    const t = j.worldGraphicsTier;
    if (t === 'low' || t === 'balanced' || t === 'high') return t;
    return 'balanced';
  } catch {
    return 'balanced';
  }
}
