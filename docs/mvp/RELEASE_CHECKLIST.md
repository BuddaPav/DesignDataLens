# Чеклист релиза MVP (Chronos)

Использовать перед сборкой десктоп-клиента для внешней раздачи.

1. `cd app && npm run mvp:gate` — без ошибок.
2. `npm run build` — успешная сборка Vite + `tsc`.
3. Опционально: `npm run desktop:pack`, проверить запуск `.exe` из `desktop-dist/`.
4. Версия: сверить `app/package.json`, подстановку в Vite (`vite.config.ts` → `__CHRONOS_VERSION__`), при сборке — `prebuild` обновляет `public/version.json` и `sw.js`. Подробнее: `docs/mvp/VERSION_ARTIFACTS.md`.
5. **Сохранение:** в JSON слота есть **`saveSchemaVersion`** (см. `CHRONOS_SAVE_SCHEMA_VERSION` в `app/src/domain/save/saveSchema.ts`); миграции — `migratePersistedSaveRevived`.
6. **Smoke (автоматизация):** в CI workflow `.github/workflows/playwright-smoke.yml` (шаг с `continue-on-error`). Локально: поднять preview и `node scripts/smoke-story.mjs` (см. `BASE_URL` в скрипте).
7. **Smoke (ручной):** интро → имя → создание персонажа → мир → сохранение / «Продолжить».
8. Сохранение: новая игра → перезапуск → «Продолжить» восстанавливает состояние.
9. Язык: переключение RU/EN на ключевых экранах без падений.
10. **Лицензии и атрибуция ассетов:** `docs/mvp/THIRD_PARTY.md` актуален для релиза.
11. Скриншоты для Store/README — по необходимости (ручной шаг).
12. **Десктоп-first:** основной артефакт — установленный клиент (Electron). Если статика когда-либо попадает в интернет, не позиционировать её как целевую SEO-страницу: в `app/index.html` — `noindex`, в `app/public/robots.txt` — полный `Disallow`.
