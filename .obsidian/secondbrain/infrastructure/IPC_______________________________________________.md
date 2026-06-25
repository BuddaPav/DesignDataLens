# IPC: аудит всех каналов на принцип минимальных привилегий.

```typescript
```typescript
import { ipcMain } from 'electron';
import { validateChannelPermissions } from '@/types/game';

// Функция для аудита всех каналов IPC
function auditIPCCanals(): void {
  const allChannels = Object.keys(ipcMain._events);

  for (const channel of allChannels) {
    const handlers = ipcMain._events[channel];

    if (!Array.isArray(handlers)) continue;

    for (const handler of handlers) {
      const { permissions } = validateChannelPermissions(channel, handler);

      if (!permissions) {
        console.warn(`Channel ${channel} has invalid or missing permissions.`);
      } else {
        console.log(`Channel ${channel} has valid permissions:`, permissions);
      }
    }
  }
}

// Вызов аудита при старте приложения
auditIPCCanals();
```

```typescript
npm run build
```
```

Generated: 2026-06-22T12:13:29.845Z