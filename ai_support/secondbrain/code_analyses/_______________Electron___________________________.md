# Автообновление Electron через канал релизов (план и UX уведомлений).

```typescript
```typescript
import { app, dialog, autoUpdater } from 'electron';
import * as path from 'path';

const UPDATE_CHANNEL = 'https://example.com/update/latest.json';

autoUpdater.setFeedURL(UPDATE_CHANNEL);

app.on('ready', () => {
  setInterval(() => {
    checkForUpdates();
  }, 60000); // Проверка обновлений каждые 60 секунд
});

function checkForUpdates() {
  autoUpdater.checkForUpdates().then(info => {
    if (info.updateAvailable) {
      showUpdateDialog(info);
    }
  }).catch(err => {
    console.error('Error checking for updates:', err);
  });
}

async function showUpdateDialog(updateInfo: any) {
  const response = await dialog.showMessageBox({
    type: 'question',
    title: 'Обновление доступно!',
    message: `Новая версия ${updateInfo.version} доступна. Вы хотите обновиться сейчас?`,
    buttons: ['Да', 'Нет'],
    defaultButton: 0
  });

  if (response.response === 0) {
    autoUpdater.downloadUpdate();
  }
}

autoUpdater.on('download-progress', progressObj => {
  console.log(`Скачивание ${Math.round(progressObj.percent)}%`);
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Обновление завершено!',
    message: 'Обновление успешно скачано. Перезапустите приложение для применения изменений.'
  }).then(response => {
    app.relaunch();
    app.exit(0);
  });
});

autoUpdater.on('error', error => {
  console.error('Ошибка обновления:', error);
});
```
```

Generated: 2026-06-22T08:12:26.769Z