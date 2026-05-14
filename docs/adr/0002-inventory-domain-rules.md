# ADR 0002: доменные правила инвентаря вынести из UI

## Статус

Принято

## Контекст

Инвентарь (`Inventory` в `types/game.ts`) используется в UI и будущей экономике. Дублирование лимитов и «магических чисел» в компонентах усложняет тестирование и i18n.

## Решение

1. Добавить слой `app/src/domain/inventory/`:
   - `constants.ts` — именованные лимиты (`MAX_GOLD_AMOUNT`, `DEFAULT_MAX_INVENTORY_SLOTS`, `MAX_ITEM_STACK`), общий `clampStackQuantity`.
   - `inventoryRules.ts` — чистые функции (`clampGold`, `hasInventoryCapacity`, …).
   - `itemCatalog.ts` — тип/редкость/i18n для ключей шаблонов (`tpl:<key>`), см. `ITEM_TEMPLATE_CATALOG`.
2. Покрыть правила unit-тестами Vitest (`__tests__/inventoryRules.test.ts`).
3. Постепенно подключать правила в `InventoryPanel` / шопе / `useGameState` при изменении экономики.

## Последствия

- Дополнительный импорт из `@/domain/inventory/*`.
- Единый источник правды для лимитов и тестируемость без React.
