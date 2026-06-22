# Запрет смешивания file:// и удалённых запросов в Electron без явного флага.

```typescript
```typescript
import { ipcRenderer } from 'electron';

let allowMixedRequests = false;

function setAllowMixedRequests(value: boolean) {
  allowMixedRequests = value;
}

function isFileProtocol(url: string): boolean {
  return url.startsWith('file://');
}

function isRemoteRequest(url: string): boolean {
  return !isFileProtocol(url);
}

function checkRequest(url: string): void {
  if (isFileProtocol(url) && isRemoteRequest(url) && !allowMixedRequests) {
    throw new Error('Mixed file:// and remote requests are not allowed.');
  }
}

// Пример использования
ipcRenderer.on('make-request', (event, url) => {
  checkRequest(url);
  // Выполнение запроса
});
```
```

Generated: 2026-06-22T06:38:27.638Z