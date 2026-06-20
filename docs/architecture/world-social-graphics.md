# Мир: социум, слухи, караваны и графика

## Рынок слухов (TTL)

- Типы: `ActiveRumor`, поля в `StoryProgress` (`types/game.ts`).
- Чистая математика распространения: `engine/gossipSpreadPure.ts` — затухание `ttlHours` и охват по рёбрам графа локаций (`connectedLocations`).
- Оркестрация: `engine/gossipNetwork.ts` — `tickActiveRumorsSync`, органический сброс слуха `maybeSpawnOrganicRumor`, редкие строки в журнал `flushRumorJournalHighlights`.
- Фракции: `factionReputation` и `factionTags` у слуха — задел под квесты и репутацию (значения можно наращивать при событиях).

## Торговые маршруты

- Граф локаций (single source): `domain/world/storyLocations.ts` (`STORY_LOCATIONS`), используется в `useGameState` и в тестах графа.
- Новые регионы MVP+:
  - `river_port`
  - `sunken_marsh`
  - `ember_hills`
- Константы маршрутов: `CHRONOS_TRADE_ROUTES` в `engine/traderCaravan.ts`:
  - `willbrook_ring`: Willbrook → Misty Crossroads → Whispering Forest → Old Ruins → Willbrook
  - `ruins_forest_shuttle`: Whispering Forest ↔ Old Ruins
  - `crossroads_loop`: Willbrook → Misty Crossroads → Whispering Forest → Willbrook
  - `village_ruins_spine`: Willbrook → Ruins → Forest → Crossroads → Willbrook
  - `misty_ruins_triangle`: Crossroads → Ruins → Forest → Crossroads (ребро Crossroads ↔ Ruins в `initialLocations`)
  - `delta_marsh_run`: Willbrook → River Port → Sunken Marsh → Whispering Forest → Willbrook
  - `ashen_ridge_line`: Crossroads → Ember Hills → Ruins → Crossroads
  - `frontier_chain`: River Port → Sunken Marsh → Ember Hills → Crossroads → River Port
- Состояние: `tradeCaravans` в `StoryProgress`; `ensureDefaultCaravans` гарантирует наличие караванов по ключевым маршрутам.
- Контракт: каждый шаг цикла — ребро `connectedLocations`; проверка `assertTradeRoutesMatchLocationGraph` в `engine/__tests__/traderCaravan.graph.test.ts`.
- `tickTradeCaravans` двигает караваны, добавляет **все** активные слухи в локацию прибытия (усиление охвата) и возвращает список `visitedLocationIds` для корректного применения при async spread.
- Экономика: `applyMarketSupplyFromCaravanVisits` пишет `market_supply:<locationId>` в `worldState.factionPowers`; лавка (`ShopPanel`) показывает тон рынка и множитель; константы в `domain/economy/caravanEconomyConstants.ts`; интеграция `engine/__tests__/caravanSupplyIntegration.test.ts`.
- В `advanceTime` добавлен лог сдвига рыночного тона (`game.market_tone_shift.*`) при переходе между `tight/neutral/fluid`.

## Web Worker

- Логика слухов вынесена в **чистые функции** (`engine/gossipSpreadPure.ts`), пригодные для выполнения в Worker без доступа к React/NPCSystem.
- `decayAndSpreadRumors` принимает инъекцию `randomFn` (по умолчанию `Math.random`) для детерминированных replay/тестов.
- Реализация Worker есть в коде:
  - `engine/gossipSpread.worker.ts` — Worker-обёртка над `decayAndSpreadRumors`
  - `engine/gossipSpreadWorkerClient.ts` — клиент с fallback, singleton Worker
- В `advanceTime` (`useGameState`) используется **гибридный режим**:
  - лёгкие тики — синхронно (`tickActiveRumorsSync` в основном потоке)
  - тяжёлые тики — `tickTradeCaravans` на снимке слухов, затем `decayAndSpreadRumorsInWorker` по правилам `domain/social/gossipWorkerRules.ts` (`shouldSpreadRumorsInWorker`: пороги часов/числа слухов **или** произведение `hours × count`), слияние охвата с посещениями караванов, **один** финальный `setPlayer` + проверка `rumorWorkerToken` / `playerRef` против устаревшего async
  - при недоступности Worker — fallback на `tickActiveRumorsSync`

## Графика

- Тип пресета: `WorldGraphicsTier` — `types/chronosGraphics.ts`; хранение в `localStorage` (`chronos_settings.worldGraphicsTier`), чтение `lib/chronosGraphicsSettings.ts`.
- UI: вкладка «Графика» в настройках — селектор рядом с HQ 3D.
- FPS-телеметрия в 3D: `recordR3fFrameTick(graphicsTier)` хранит EMA по tier (`low/balanced/high`) в `debug/chronosTelemetry.ts`.
- Shadow preset: `WorldScene3D` выбирает карту теней по tier (`512/1024/2048`) с fallback `512` для weak-GPU профиля (`hardwareConcurrency <= 4`).
- DPR cap: в `high` tier верхняя граница ограничена `1.5` (согласование с `perf-budgets.json`).
- Постобработка: `WorldPostFX.tsx` — bloom / god rays (на low — нулевой вес) / noise / chromatic / hue & saturation («колористика» по эпохе) / vignette / ACES / SMAA.
- Вода: `WaterSurface.tsx` — псевдо-отражение через `reflect()` и градиент неба (`uSkyZenith`, `uSkyHorizon`), сила `uReflectStr` по tier; сегменты сетки по tier.
- 2D-карта без «плоскости»: `components/game/WorldCanvas.tsx` и `engine/tacticalMapPaint.ts` дополнены relief-слоем по `elevationAt` (ridge/cliff lighting + контурные штрихи высот), чтобы тактическая и обычная карта читались как объёмный рельеф, а не ровная заливка тайлов.

## Связь с временем

В `advanceTime` (`useGameState`): после симуляции NPC идут слухи → караваны → запись в лог; обновляются `activeRumors`, `tradeCaravans` и (при наличии тегов) `factionReputation`.
