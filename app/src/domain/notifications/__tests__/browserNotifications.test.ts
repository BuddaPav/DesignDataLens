import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as gameSettings from '@/lib/chronosGameSettings';
import {
  notifyGameBrowserEvent,
  requestBrowserNotificationPermission,
} from '@/domain/notifications/browserNotifications';

describe('requestBrowserNotificationPermission', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns unsupported when Notification is missing', async () => {
    vi.stubGlobal('Notification', undefined);
    await expect(requestBrowserNotificationPermission()).resolves.toEqual({ kind: 'unsupported' });
  });

  it('returns blocked when permission already denied', async () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'denied';
        static requestPermission = vi.fn();
      },
    );
    await expect(requestBrowserNotificationPermission()).resolves.toEqual({ kind: 'blocked' });
  });

  it('returns granted already when permission was granted', async () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'granted';
        static requestPermission = vi.fn();
      },
    );
    await expect(requestBrowserNotificationPermission()).resolves.toEqual({
      kind: 'granted',
      via: 'already',
    });
  });

  it('calls requestPermission when default and maps granted', async () => {
    const req = vi.fn().mockResolvedValue('granted' as NotificationPermission);
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'default';
        static requestPermission = req;
      },
    );
    await expect(requestBrowserNotificationPermission()).resolves.toEqual({
      kind: 'granted',
      via: 'prompt',
    });
    expect(req).toHaveBeenCalledOnce();
  });

  it('maps prompt denial', async () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission: NotificationPermission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('denied' as NotificationPermission);
      },
    );
    await expect(requestBrowserNotificationPermission()).resolves.toEqual({ kind: 'prompt_denied' });
  });
});

describe('notifyGameBrowserEvent', () => {
  let loadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loadSpy = vi.spyOn(gameSettings, 'loadChronosGameSettings').mockReturnValue({
      ...gameSettings.DEFAULT_CHRONOS_GAME_SETTINGS,
      notifications: true,
    });
    vi.stubGlobal(
      'Notification',
      Object.assign(
        vi.fn(function NotificationMock(this: unknown, title: string) {
          void title;
        }),
        { permission: 'granted' as NotificationPermission },
      ),
    );
  });

  afterEach(() => {
    loadSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does nothing when notifications are disabled in settings', () => {
    loadSpy.mockReturnValue({
      ...gameSettings.DEFAULT_CHRONOS_GAME_SETTINGS,
      notifications: false,
    });
    const Notif = globalThis.Notification as unknown as ReturnType<typeof vi.fn> & {
      permission: NotificationPermission;
    };
    notifyGameBrowserEvent({ tag: 't', title: 'Hi' });
    expect(Notif).not.toHaveBeenCalled();
  });

  it('does nothing when tab is visible (toast path)', () => {
    expect(document.visibilityState).toBe('visible');
    const Notif = globalThis.Notification as unknown as ReturnType<typeof vi.fn>;
    notifyGameBrowserEvent({ tag: 't', title: 'Hi' });
    expect(Notif).not.toHaveBeenCalled();
  });

  it('shows notification when tab is hidden', () => {
    vi.stubGlobal(
      'Notification',
      Object.assign(vi.fn(), { permission: 'granted' as NotificationPermission }),
    );
    const Notif = globalThis.Notification as unknown as ReturnType<typeof vi.fn> & {
      permission: NotificationPermission;
    };
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    notifyGameBrowserEvent({ tag: 'chronos-test', title: 'Boss', body: 'Done' });
    expect(Notif).toHaveBeenCalledOnce();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('honors skipWhenTabVisible: false when visible', () => {
    vi.stubGlobal(
      'Notification',
      Object.assign(vi.fn(), { permission: 'granted' as NotificationPermission }),
    );
    const Notif = globalThis.Notification as unknown as ReturnType<typeof vi.fn>;
    notifyGameBrowserEvent({
      tag: 'err',
      title: 'Fail',
      skipWhenTabVisible: false,
    });
    expect(Notif).toHaveBeenCalledOnce();
  });
});
