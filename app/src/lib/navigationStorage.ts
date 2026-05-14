/**
 * Локальное хранение меток навигации и пользовательских настроек карты (без React).
 */

export type NavWaypoint = {
  id: string;
  tileX: number;
  tileY: number;
  label: string;
  color: string;
};

export type NavPing = { tileX: number; tileY: number; until: number };

export type NavigationSettings = {
  mapOpacity: number;
  mapZoomSensitivity: number;
  northLock: boolean;
  edgePanSpeed: number;
  minimapEnabled: boolean;
  minimapScale: number;
};

const KEY = 'chronos_navigation';

const defaultNav: NavigationSettings = {
  mapOpacity: 0.88,
  mapZoomSensitivity: 1,
  northLock: false,
  edgePanSpeed: 1,
  minimapEnabled: true,
  minimapScale: 1
};

export type NavigationState = {
  waypoints: NavWaypoint[];
  pings: NavPing[];
  settings: NavigationSettings;
};

export function loadNavigation(): NavigationState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { waypoints: [], pings: [], settings: { ...defaultNav } };
    }
    const j = JSON.parse(raw) as Partial<NavigationState>;
    return {
      waypoints: Array.isArray(j.waypoints) ? j.waypoints : [],
      pings: Array.isArray(j.pings) ? j.pings : [],
      settings: { ...defaultNav, ...(j.settings ?? {}) }
    };
  } catch {
    return { waypoints: [], pings: [], settings: { ...defaultNav } };
  }
}

export function saveNavigation(state: NavigationState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
    return;
  }
  window.dispatchEvent(new Event('chronos:navigation_updated'));
}

export function pruneExpiredPings(pings: NavPing[], now = Date.now()): NavPing[] {
  return pings.filter((p) => p.until > now);
}

/** Краткая метка на тайле игрока (сонар / «пинг»). */
export function addWorldPing(tileX: number, tileY: number, durationMs = 3200): void {
  const s = loadNavigation();
  saveNavigation({
    ...s,
    pings: [...pruneExpiredPings(s.pings), { tileX, tileY, until: Date.now() + durationMs }]
  });
}
