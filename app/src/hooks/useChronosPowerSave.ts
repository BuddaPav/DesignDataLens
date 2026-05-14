import { useEffect, useState } from 'react';

/**
 * Пауза тяжёлого рендера при свёрнутом окне / фоне (MVP 070).
 * Браузер: Page Visibility; Electron: IPC minimize/restore из preload.
 */
export function useChronosPowerSavePaused(): boolean {
  const [paused, setPaused] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false,
  );

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.chronosDesktop : undefined;
    let electronOccluded = false;

    const apply = () => {
      setPaused(document.visibilityState === 'hidden' || electronOccluded);
    };

    document.addEventListener('visibilitychange', apply);

    let unsub: (() => void) | undefined;
    if (api?.onOcclusionChanged) {
      unsub = api.onOcclusionChanged(({ occluded }) => {
        electronOccluded = occluded;
        apply();
      });
    }

    apply();

    return () => {
      document.removeEventListener('visibilitychange', apply);
      unsub?.();
    };
  }, []);

  return paused;
}
