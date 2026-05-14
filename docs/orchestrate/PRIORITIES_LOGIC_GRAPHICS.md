# Приоритеты: логика и графика

Ориентир для ревью и рефакторинга: сначала **корректность и предсказуемость** симуляции и экономики, затем **стабильный кадр** и качество картинки по пресетам.

## Логика (первый приоритет)

| Подсистема | Где в коде | Заметки |
|------------|------------|---------|
| Связка время ↔ NPC ↔ мир | `docs/orchestrate/NPC_WORLD_LOGIC.md` | Один вызов `simulateNPCTurn` на пропуск часов |
| Состояние игрока, время, слухи, караваны | `hooks/useGameState.ts`, `engine/gossipNetwork.ts`, `engine/traderCaravan.ts` | Тяжёлые тики и worker — см. `docs/architecture/world-social-graphics.md` |
| Чистые правила без React | `domain/**`, `engine/gossipSpreadPure.ts` | Контракты покрывать `*.test.ts` |
| Экономика магазина и спрос | `domain/economy/shopPurchase.ts`, `domain/economy/caravanEconomy.ts` | Цены только через `resolveShopGoldPrice` |
| Инвентарь | `domain/inventory/inventoryRules.ts` | ADR 0002 |

**Правило:** изменение поведения игрока → тест домена или явный ADR.

## Графика (второй приоритет, но обязательный tier)

| Слой | Где | Заметки |
|------|-----|---------|
| Пресет качества | `WorldGraphicsTier`, `lib/chronosGraphicsSettings.ts`, настройки | `low` / `balanced` / `high` |
| Three.js сцена | `WorldScene3D.tsx`, `WaterSurface.tsx`, `OptionalLocalGlb.tsx` | Разрешения текстур, instancing, дальность Scatter |
| Постобработка | `world/WorldPostFX.tsx` | Сила эффектов от tier; на low god rays «выключены» весом |
| 2D карта / UI | `WorldCanvas.tsx`, `WorldTacticalMapOverlay.tsx` | Отдельный пайплайн от 3D |

**Правило:** любой новый тяжёлый эффект должен иметь ветку **low** (отключение или упрощение). Не поднимать DPR на low.

## Порядок работ в PR

1. Логика и данные — зелёные unit-тесты для затронутого домена.
2. Графика — проверить три tier вручную или отметить риск в описании PR.
3. Gate: `cd app && npm run orchestrate:gate`.
