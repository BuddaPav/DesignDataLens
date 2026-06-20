# Логика NPC и мира

Краткая карта того, как связаны **время**, **NPC** и **мировые системы** после действий игрока.

## Горячие клавиши в игре

На игровом экране (не в полях ввода): **M** — тактическая карта, **G** — пинг на тайле, **I** — инвентарь, **Q** — квесты, **Esc** — закрыть карту или боковую панель. Подсказка в интерфейсе: `game.hotkeys_hint`.

## Пропуск времени (`advanceTime`)

Порядок в `useGameState` (упрощённо):

1. Обновить `GameTime` в `storyProgress.worldState.time` (день/месяц/год при переполнении).
2. **Поколения / базовый социальный дрейф** — `runGenerationsTick`, `runAdvancedSocietyTick`, `runCrowdSocietyTick`.
3. **Слухи и караваны** — см. `docs/architecture/world-social-graphics.md` (TTL, `factionPowers`, worker для тяжёлого spread). Порядок теперь единый для sync/worker: сначала spread слухов, затем тик караванов по актуальному набору слухов (без расхождения причинной цепочки). **Коалиции врагов:** полоска `EnemyCoalitionBar` над футером + вкладка в панели «Мир», тактическая карта уже показывает пины.
4. **Очередь последствий слухов**, репутация фракций, коалиции врагов — `tryEnemyCoalitionFormation`.
5. Запись состояния игрока (лог, слухи, караваны, время).
6. **Автономия NPC** — для каждого NPC вызывается `NPCSystem.simulateNPCTurn(npcId, hoursElapsed, hourOfDay)`:
   - `hoursElapsed` — сколько **игровых** часов пропущено (один проход `driftMentalState` на этот объём).
   - `hourOfDay` — **час игрового времени** после шага (`newTime.hour`), чтобы расписание (`schedule.routines`) совпадало с лором, а не с часами ОС.

Раньше психика дрейфилась дважды (в хуке и внутри симуляции с фиктивным «текущим временем» ОС) — это устранено.

## Процедурный мир (карта)

- Тайлы и биомы: `engine/worldTiles.ts` (`biomeAt`, `elevationAt`, пределы `WORLD_SIZE`).
- Позиция игрока: `clampWorldPosition`, якоря локаций `getLocationAnchor`.

## Где править поведение

| Изменение | Файлы |
|-----------|--------|
| Новый шаг социума при skip времени | `engine/societySimulation.ts`, при необходимости вызов из `advanceTime` |
| Расписание NPC | шаблоны/данные NPC и поле `schedule` в типах |
| Реакции психики на время | `engine/psychology.ts` (`driftMentalState`) |
| Диалоги / память NPC | `NPCSystem`, `dialogueSystem`, `MemorySystem` |
