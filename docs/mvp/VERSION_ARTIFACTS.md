# Версия Chronos — где задаётся (MVP 079)

Единственный номер версии: **`app/package.json` → `version`**.

| Артефакт | Как попадает версия |
|----------|---------------------|
| `APP_VERSION` в клиенте | Vite `define`: `__CHRONOS_VERSION__` из `package.json` (`app/vite.config.ts`), модуль `app/src/version.ts`. |
| PWA / проверка обновления | `npm run prebuild` → `scripts/sync-version.mjs` → `public/version.json`. |
| Service Worker кэш | Тот же скрипт патчит `public/sw.js` (`CACHE_NAME`). |
| Electron | Читает приложение из корня `app/`; версия дистрибутива совпадает с `package.json` при сборке из этого каталога. |

После смены версии выполните сборку с `prebuild` или вручную `node scripts/sync-version.mjs`.
