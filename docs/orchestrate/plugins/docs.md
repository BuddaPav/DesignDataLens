# Плагин **docs** (живая документация)

## Цель

Текст и диаграммы не расходятся с кодом.

## Артефакты

| Файл / каталог | Содержание |
|----------------|------------|
| `docs/glossary.md` | Термины Chronos |
| `docs/architecture/module-dependencies.mmd` | Mermaid-граф слоёв |
| `docs/architecture/module-graph.json` | Автовывод зависимостей (`npm run deps:export`) |
| `docs/adr/` | Решения |

## API-документация

Публичного REST нет; «API» клиента — **экспорты TypeScript**. При изменении контрактов в `types/game.ts` или `domain/**` — обновить ADR или комментарий к типу.

## Перед генерацией нового кода

Агент читает **глоссарий** и ADR по затронутой области (правило в `chronos-orchestrate-pipeline.mdc`).
