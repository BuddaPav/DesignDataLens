# Narrative Bible

## Core Principles

- Любая сцена меняет состояние мира или отношений, иначе это filler.
- Выборы имеют последствия минимум в одном из слоев: world, faction, character.
- Fail-forward: провал не блокирует игру, а открывает альтернативную ветку.

## Quest and Scene Design

- Main arc содержит четкие переходы между регионами и stakes escalation.
- Side arcs усиливают фракционные конфликты и world lore.
- У каждого квеста есть:
  - `entry_condition`,
  - `progression_states`,
  - `completion_paths`,
  - `failure_outcomes`,
  - `softlock_guard`.

## Dialogue and NPC Memory

- Линии диалога проверяются на tone consistency по worldEra/faction.
- Память NPC не должна противоречить последним подтвержденным world событиям.
- Для ключевых NPC нужно предусмотреть procedural fallback при недоступности локальной LLM.

## Localization and Narrative Data

- Narrative keys проходят parity-check RU/EN на этапе merge.
- L10n-строки не содержат зашитых переменных без токенов.
- Narrative contracts должны быть совместимы с `@/types/game`.

## Definition of Done (Narrative)

- Пройдены проверки из `docs/orchestrate/narrative-checklist.md`.
- Нет критических soft-lock risks в quest graph.
- Сцена покрыта функциональными/контентными тестами уровня вертикали.
