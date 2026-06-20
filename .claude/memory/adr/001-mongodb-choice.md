# ADR 001: Выбор MongoDB для игрового состояния

## Status: Accepted

## Context
Нужно хранить:
- NPC с динамическими схемами (разные профессии, квесты)
- Состояние игрока с evolving полями
- Диалоги с деревьями вариантов

## Decision
Использовать MongoDB (Atlas) вместо PostgreSQL

## Reasoning
### За
- Flexible schemas для NPC vs hard таблицы
- Иерархические данные (диалоги) = natural JSON
- Easier prototyping для игровой логики

### Против
- ACID транзакции сложнее
- Миграции схемы требуют осторожности

## Alternatives Considered
- PostgreSQL: слишком rigid для NPC evolucion
- Redis: не хватает query flexibility

## Consequences
### Positive
- Быстрая итерация NPC/templates
- Natural JSON в коде

### Negative
- Нужна миграция если перейдем на SQL аналитику

## Related
- ADR 002: In-memory state design
- ADR 005: Vector embeddings for NPC memory