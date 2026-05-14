# ADR 0005: локальная репутация в последствиях сюжета

## Статус

Принято

## Контекст

Репутация по ключу `location:<id>` уже используется при социальных слухах (`NPCSystem` / `useGameState`). Нужен **единый контракт** для сцен и квестов: сдвиг «настроения окрестностей» без дублирования логики в UI.

## Решение

1. Поля **`locationReputationDelta`** (карта `locationId` → число) в объекте `value` для типов последствий:
   - `world_event`
   - `quest_complete`
   - `quest_unlock`
2. Применение в `applyChoiceConsequencesBatch` (`applyLocationReputationDelta`): нормализация ключа `location:<id>`, кламп −100…100 на ключ, строка в `worldEventLog`.
3. **`AIStoryEngine.generateConsequences`**: часть событий мира добавляет совместно `locationReputationDelta` (текущая локация) и опционально `factionReputationDelta`.
4. Порог вызова worker для слухов вынесен в `domain/social/gossipWorkerRules.ts` (`shouldSpreadRumorsInWorker`: классические пороги часов и числа слухов **или** эвристика нагрузки `hours × activeRumorCount`).
5. **`ChoiceBatchSideEffects`** в `applyChoiceConsequencesBatch`: дельты `npc_relationship` и список **`npc_mark_dead`** (и `markNpcDead` в narrative payload) обрабатываются в `useGameState` через `NPCSystem` (`syncPlayerRelationshipType`, `markNpcDead` + обида союзников).

## Последствия

- Старые сохранения совместимы: поле опционально.
- Тип последствия `npc_relationship` **не** должен совпадать с веткой `quest_unlock` (исправлено в коде).
- Новые маршруты караванов и предметы каталога не требуют отдельного ADR; граф модулей обновлять при крупных импортах.
