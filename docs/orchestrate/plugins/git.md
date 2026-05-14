# Плагин **git** (контроль версий)

## Цель

Прослеживаемая история и ветки под задачи.

## Conventional Commits (рекомендуется)

- `feat:` — функциональность  
- `fix:` — исправление  
- `docs:` — только документация  
- `chore:` — скрипты, конфиги  
- `test:` — тесты  

Пример: `feat(inventory): add domain clamp helpers`.

## Ветки

Для крупной фичи Orchestrate: `feat/orchestrate-<кратко>` или `feat/inventory-domain-rules`.

## Автокоммиты и rollback

Полный автокоммит после каждого сохранения в Cursor **не включён** (риск шума). Рекомендуется:

1. Локально: осмысленные коммиты после зелёного `npm run orchestrate:gate`.  
2. Rollback: `git revert` / `git reset` при падении gate в CI.

## PR

Шаблон: `.github/pull_request_template.md`.
