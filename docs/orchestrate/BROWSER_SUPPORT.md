# Поддерживаемые браузеры (BACKLOG #98)

Целевой клиент Chronos — **современный Chromium** (локальный веб-сборка, PWA, **Electron**).

| Канал | Минимум | Примечание |
|-------|---------|------------|
| Electron (desktop) | Bundled Chromium из текущей версии Electron в `package.json` | Основной канал дистрибуции |
| Chrome / Edge | Последние два мажорных семейства | WebGPU и WebLLM ожидаются |
| Firefox / Safari | Best-effort | WebGPU/WebLLM могут быть недоступны; процедурный fallback |

Перед релизом: ручная проверка на одной версии Chrome и на сборке Electron.
