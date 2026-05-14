# Orchestrate — операционная модель Chronos

Это **не отдельный бинарник**, а соглашение: правила Cursor (`.cursor/rules/`), документация, скрипты `npm` и ADR работают как **единый pipeline**. Реальная автоматизация там, где возможно без платных закрытых сервисов: ESLint, Vitest, Madge, ручной/CI запуск ворот.

Принципы и обязательные правила: **`PRINCIPLES.md`**, **`TECH_DEBT.md`**, правило Cursor **`chronos-orchestrate-must-have.mdc`**.

## Целевой pipeline

```mermaid
flowchart LR
  M[memory ADR] --> R[rules + decomposition]
  R --> T[test Vitest]
  T --> O[orchestrate implement]
  O --> V[review lint + self-check]
  V --> P[perf budgets]
  P --> G[git commit]
  G --> D[docs ADR / glossary / diagrams]
  D --> M2[memory ADR update]
```

## Плагины (логические модули)

| Плагин | Роль | Артефакты в репозитории |
|--------|------|-------------------------|
| [memory](./plugins/memory.md) | ADR, история решений | `docs/adr/` |
| [rules](./plugins/rules.md) | Конвенции, стиль | `.cursor/rules/chronos-code-conventions.mdc`, `eslint.config.js` |
| [test](./plugins/test.md) | TDD-цикл | `vitest` в `vite.config.ts`, `src/**/*.test.ts` |
| [docs](./plugins/docs.md) | Живая документация | `docs/glossary.md`, `docs/architecture/*.mmd`, ADR |
| [git](./plugins/git.md) | Версионирование | Conventional commits, ветки, PR-шаблон |
| [review](./plugins/review.md) | Ревью до merge | `npm run lint`, чеклист в PR |
| [perf](./plugins/perf.md) | Бюджеты | `perf-budgets.json` |
| [deps](./plugins/deps.md) | Граф модулей | `npm run deps:circular`, `npm run deps:export` |
| [scaffold](./plugins/scaffold.md) | Шаблоны архитектуры | `app/src/scaffolds/` |
| [prototype](./plugins/prototype.md) | Быстрая проверка идей, TTL | Маркер `[PROTOTYPE]`, без автоудаления кода |
| [telemetry](./plugins/telemetry.md) | Профайлинг / метрики dev | `app/src/debug/chronosTelemetry.ts` |
| [asset-pipeline](./plugins/asset-pipeline.md) | Контент и зависимости | `npm run orchestrate:assets`, скрипты `generate-*.mjs` |
| [GRAPHICS_INVENTORY](./GRAPHICS_INVENTORY.md) | Аудит графики, реестр путей | `app/src/domain/assets/chronosGraphicsRegistry.ts`, `public/assets/chronos-ai-chronicles/` |
| [narrative](./plugins/narrative.md) | Сюжет ↔ механика | `narrative-checklist.md`, типы в `@/types/game` |
| [archaeology](./plugins/archaeology.md) | Аудит раз в ~50 коммитов | `npm run orchestrate:archaeology` |

## Ворота (`orchestrate:gate`)

Из каталога `app/`:

```bash
npm run orchestrate:gate
```

Выполняет: **lint → unit tests → проверка циклических зависимостей**.

Дополнительно:

- Worker-потоки допускаются только при сохранении консистентности state и зелёного gate; пример: тик слухов в `engine/gossipSpread.worker.ts` (см. `docs/architecture/world-social-graphics.md`, отмеченные ограничения — `TECH_DEBT.md`).
- `npm run orchestrate:archaeology` — напоминание об аудите (см. [archaeology](./plugins/archaeology.md)).
- `npm run orchestrate:assets` — список файлов в `public/` для сверки ссылок.

## Демонстрация на игровой системе

- **[Инвентарь: домен + тесты](./demo-inventory-system.md)** — `app/src/domain/inventory/`, ADR `docs/adr/0002-inventory-domain-rules.md`.
