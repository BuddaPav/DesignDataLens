# Мир: социум, слухи, караваны и графика

## Рынок слухов (TTL)

- Типы: `ActiveRumor`, поля в `StoryProgress` (`types/game.ts`).
- Чистая математика распространения: `engine/gossipSpreadPure.ts` — затухание `ttlHours` и охват по рёбрам графа локаций (`connectedLocations`).
- Оркестрация: `engine/gossipNetwork.ts` — `tickActiveRumorsSync`, органический сброс слуха `maybeSpawnOrganicRumor`, редкие строки в журнал `flushRumorJournalHighlights`.
- Фракции: `factionReputation` и `factionTags` у слуха — задел под квесты и репутацию (значения можно наращивать при событиях).

## Торговые маршруты

- Константы маршрутов: `CHRONOS_TRADE_ROUTES` в `engine/traderCaravan.ts`:
  - `willbrook_ring`: Willbrook → Misty Crossroads → Whispering Forest → Old Ruins → Willbrook
  - `ruins_forest_shuttle`: Whispering Forest ↔ Old Ruins
  - `crossroads_loop`: Willbrook → Misty Crossroads → Whispering Forest → Willbrook
- Состояние: `tradeCaravans` в `StoryProgress`; `ensureDefaultCaravans` гарантирует наличие караванов по ключевым маршрутам.
- `tickTradeCaravans` двигает караваны, добавляет **все** активные слухи в локацию прибытия (усиление охвата) и возвращает список `visitedLocationIds` для корректного применения при async spread.

## Web Worker

- Логика слухов вынесена в **чистые функции** (`engine/gossipSpreadPure.ts`), пригодные для выполнения в Worker без доступа к React/NPCSystem.
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
- Постобработка: `WorldPostFX.tsx` — bloom / god rays (на low — нулевой вес) / noise / chromatic / hue & saturation («колористика» по эпохе) / vignette / ACES / SMAA.
- Вода: `WaterSurface.tsx` — псевдо-отражение через `reflect()` и градиент неба (`uSkyZenith`, `uSkyHorizon`), сила `uReflectStr` по tier; сегменты сетки по tier.

## Связь с временем

В `advanceTime` (`useGameState`): после симуляции NPC идут слухи → караваны → запись в лог; обновляются `activeRumors`, `tradeCaravans` и (при наличии тегов) `factionReputation`.
