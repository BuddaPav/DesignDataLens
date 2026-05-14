/**
 * Обёртка над Notification API без UI — тосты остаются в компонентах.
 */

import { chronosGraphicsUrl } from '@/domain/assets/chronosGraphicsRegistry';
import { loadChronosGameSettings } from '@/lib/chronosGameSettings';

/** Иконка для системного уведомления (Kenney HUD из пайплайна prebuild). */
const BROWSER_NOTIFY_ICON_REL = 'ui/ui_icon_quest_24.png';

/** Стабильные теги — дедупликация и замена предыдущего уведомления того же типа. */
export const CHRONOS_BROWSER_NOTIFY_TAGS = {
  levelUp: 'chronos-browser-level-up',
  manualSave: 'chronos-browser-save',
  shopPurchase: 'chronos-browser-shop',
  saveRecovered: 'chronos-browser-save-recovered',
  sceneGenerationFailed: 'chronos-browser-scene-failed',
} as const;

export type NotifyGameBrowserOptions = {
  title: string;
  body?: string;
  tag: string;
  /**
   * Если true (по умолчанию), не показывать системное уведомление, когда вкладка на переднем плане —
   * пользователь уже видит тост.
   */
  skipWhenTabVisible?: boolean;
};

export type NotificationPermissionResult =
  | { kind: 'granted'; via: 'already' | 'prompt' }
  | { kind: 'blocked' }
  | { kind: 'unsupported' }
  | { kind: 'prompt_denied' };

/**
 * Запрашивает системное разрешение, если браузер в состоянии `default`.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionResult> {
  const g = globalThis as typeof globalThis & { Notification?: typeof Notification };
  if (!('Notification' in g) || typeof g.Notification === 'undefined') {
    return { kind: 'unsupported' };
  }
  const { Notification: Notif } = g;
  if (Notif.permission === 'denied') {
    return { kind: 'blocked' };
  }
  if (Notif.permission === 'granted') {
    return { kind: 'granted', via: 'already' };
  }
  const p = await Notif.requestPermission();
  if (p === 'granted') {
    return { kind: 'granted', via: 'prompt' };
  }
  return { kind: 'prompt_denied' };
}

/**
 * Показывает системное уведомление, если в настройках включены уведомления и выдано разрешение браузера.
 * Читает актуальные настройки из localStorage (как и остальной игровой UI после сохранения в Settings).
 */
export function notifyGameBrowserEvent(opts: NotifyGameBrowserOptions): void {
  const settings = loadChronosGameSettings();
  if (!settings.notifications) return;

  const skipWhenVisible = opts.skipWhenTabVisible !== false;
  if (
    skipWhenVisible &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible'
  ) {
    return;
  }

  const g = globalThis as typeof globalThis & { Notification?: typeof Notification };
  if (!('Notification' in g) || typeof g.Notification === 'undefined') return;
  if (g.Notification.permission !== 'granted') return;

  try {
    const icon = chronosGraphicsUrl(BROWSER_NOTIFY_ICON_REL);
    new g.Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon,
    });
  } catch {
    // Политики браузера / отсутствие поддержки полей — тосты уже показаны вызывающим кодом.
  }
}
