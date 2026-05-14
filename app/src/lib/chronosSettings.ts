/** Чтение настроек из `localStorage` без импорта React. */

import { CHRONOS_SETTINGS_STORAGE_KEY } from '@/lib/chronosGameSettings';

export function readProceduralDialogsOnly(): boolean {
  try {
    const raw = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
    if (!raw) return false;
    const j = JSON.parse(raw) as { proceduralDialogsOnly?: boolean };
    return j.proceduralDialogsOnly === true;
  } catch {
    return false;
  }
}

/** Автозагрузка WebLLM в фоне; по умолчанию true. */
export function readWebLlmAutoload(): boolean {
  try {
    const raw = localStorage.getItem(CHRONOS_SETTINGS_STORAGE_KEY);
    if (!raw) return true;
    const j = JSON.parse(raw) as { webLlmAutoload?: boolean };
    return j.webLlmAutoload !== false;
  } catch {
    return true;
  }
}
