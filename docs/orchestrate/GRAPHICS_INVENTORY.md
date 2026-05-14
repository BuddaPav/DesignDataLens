# Инвентаризация графики Chronos (Orchestrate / graphics-critical)

Единый кодовый реестр: `app/src/domain/assets/chronosGraphicsRegistry.ts`.  
Публичные файлы: `app/public/assets/chronos-ai-chronicles/` (см. `README.txt`).  
Внешние стоки (Kenney, OGA, Poly Haven и др.): `docs/orchestrate/GRAPHICS_SOURCES.md`.

## Фаза 1 — аудит (сводка)

| Область | Есть в проекте | Пробелы / задел |
|---------|----------------|-----------------|
| Персонажи / NPC UI | Рамки портрета (процедурные кольца), **статусы HUD — Kenney Game Icons CC0** (`vendor-kenney-icons.mjs`), заглушка глифа при ошибке аватара | Уникальные портреты по NPC — по желанию заменить растром |
| Окружение 2D | Атлас биомов `atlas_world_v01.*` | Доп. атласы по `manifest.json` в README — опционально |
| Окружение 3D | Рельеф + шум, вода, острова, пост-FX, PMREM, облака/звёзды | Уникальные меши под каждый биом — расширение `proceduralGeometries` |
| UI shell | Tailwind + shadcn + Lucide иконки в коде | Часть игровых иконок — PNG в `ui/` (quest, close); остальное — Lucide |
| Эффекты | Частицы canvas, GradientMesh, штормы и т.д. | — |
| Анимации | CSS (`App.css`), компонентные анимации, Three useFrame | Полный скелетный риг персонажа — нет (не цель текущего жанра) |
| Шрифты | Exo 2 / Inter через `@fontsource/*` в `main.tsx` (офлайн-first, без Google Fonts) | — |
| Иконки приложения | `public/icons/*.png` | — |

Приоритеты в реестре: **critical** — загрузка мира / интро / иконки приложения; **high** — NPC HUD / вода / пост-FX; **medium** — мелкие UI PNG.

## Фаза 2 — где искали задания

- `docs/orchestrate/plugins/asset-pipeline.md` — правила пайплайна.
- `docs/architecture/world-social-graphics.md` — связь UI tier и постобработки.
- `README.md` (контекст ИИ) — визуальная планка и перечень 3D-модулей.
- `.cursor/orchestrate/checkpoint_*.json` — чекпоинты агента, не отдельные ТЗ на арт.

## Фазы 3–4 — заглушки и интеграция

- SVG `ui/chronos_glyph_placeholder.svg` — масштабируемая заглушка; URL: `chronosPlaceholderGlyphUrl()`.
- Заглушки атласов `atlas_npc_v01.*` и `atlas_ui_v01.*` генерируются `app/scripts/generate-chronos-atlas.mjs` (один тайл 32×32), чтобы пути из `manifest.json` не вели в пустоту до полноценного арта.
- Все новые публичные пути добавлять в `CHRONOS_GRAPHICS_REGISTRY` с полем **swap** (одна строка замены).

## Фаза 5 — проверка цельности

- Нет «дыры» в базовом потоке: интро → сплэш из реестра → 2D или 3D по настройкам.
- При отсутствии `generated/manifest.json` интро использует дефолтный сплэш (уже в коде).
