import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION } from '@/version';

export interface RemoteUpdateManifest {
  version: string;
  downloadUrl?: string;
  releaseNotesRu?: string;
  releasedAt?: string;
}

function semverCompare(a: string, b: string): number {
  const pa = a.split(/[.+]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.split(/[.+]/).map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

const DISMISS_KEY = 'chronos_update_dismissed_version';

/**
 * Периодически запрашивает манифест (по умолчанию /version.json или VITE_UPDATE_MANIFEST_URL).
 * При новой версии — баннер; полный апдейт = новая сборка клиента / ссылка из манифеста, перезапуск приложения.
 */
/** По умолчанию проверка каждые 5 минут (как в спецификации Kimi для манифеста). */
export function useUpdateCheck(intervalMs = 5 * 60 * 1000) {
  const [remote, setRemote] = useState<RemoteUpdateManifest | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const check = useCallback(async () => {
    const envUrl = import.meta.env.VITE_UPDATE_MANIFEST_URL as string | undefined;
    const base = import.meta.env.BASE_URL || '/';
    const url = envUrl?.trim() || `${base}version.json`;
    try {
      const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const json = (await res.json()) as RemoteUpdateManifest;
      if (json?.version && typeof json.version === 'string') {
        setRemote(json);
      }
    } catch {
      /* офлайн / file:// */
    }
  }, []);

  useEffect(() => {
    void check();
    const id = window.setInterval(() => void check(), intervalMs);
    return () => window.clearInterval(id);
  }, [check, intervalMs]);

  const updateAvailable =
    Boolean(remote) &&
    semverCompare(remote!.version, APP_VERSION) > 0 &&
    dismissedFor !== remote!.version;

  const dismiss = useCallback(() => {
    if (!remote) return;
    try {
      localStorage.setItem(DISMISS_KEY, remote.version);
    } catch {
      /* */
    }
    setDismissedFor(remote.version);
  }, [remote]);

  return { updateAvailable, remote, dismiss, checkNow: check, currentVersion: APP_VERSION };
}
