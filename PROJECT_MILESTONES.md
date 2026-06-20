# PROJECT_MILESTONES — Chronos: AI Chronicles

Живой план для режима **autonomous-session** (`docs/orchestrate/plugins/autonomous-session.md`). После каждой завершённой итерации: отметьте `[x]`, перенесите значимые **`// DECISION`** из кода в **DECISIONS LOG**.

Фазы сопоставлены с продуктом (не «абстрактный Unity»): **Core** = цикл игры и мир; **Systems** = движки и домен; **Content** = сцены/квесты/экономика; **Polish** = графика, i18n, линт, перф.

---

## Phase CORE — цикл игры, ввод, карта, камера мира

- [x] Фазы `intro` → `character_creation` → `playing` (`useGameState`)
- [x] Сцена с выбором: `SceneRenderer`, последствия батча
- [x] Тактическая 2D-карта + оверлей, миникарта, компас, навигация (`WorldTacticalMapOverlay`, `MapPanel`, настройки)
- [x] 3D-мир с пресетами качества и откатом на 2D (`WorldViewport`, `WorldScene3D`, `WorldCanvas`)
- [x] Десктоп Electron + веб-сборка Vite; установщик NSIS (см. README)

## Phase SYSTEMS — сохранения, NPC, социум, инвентарь, ИИ

- [x] Сохранения localStorage + полный архив в IndexedDB (`saveSystem`)
- [x] Домен инвентаря + каталог шаблонов + тесты
- [x] NPC: память, отношения, психика, диалоги; WebLLM-гибрид (`NPCSystem`, `localAI`)
- [x] Слухи, караваны, репутация фракций, панель «Мир» (базовый слой)
- [x] Вызов **`markNpcDead`** из полноценного боя (не только сцена/нарратив)
- [x] Worker/изоляция тяжёлого расчёта слухов при больших `hours` (без рассинхрона сохранений)
- [x] UI коалиций врагов, связанный с повседневным геймплеем (не только `WorldStatusPanel`)

## Phase CONTENT — локации, квесты, процедурный нарратив

- [x] Движок сюжета, квесты, шаблоны сцен (`AIStoryEngine`, последствия `applyChoiceConsequences`)
- [x] Расширение маршрутов караванов: ребро графа Misty Crossroads ↔ Old Ruins, маршрут `misty_ruins_triangle`, тест `traderCaravan.graph` / `assertTradeRoutesMatchLocationGraph`
- [x] Привязка караванов к экономике (supply в `factionPowers`, цены лавки, UI тон рынка, константы + интеграционный тест)
- [x] Новые регионы и дополнительные локации (граф вынесен в `storyLocations`, добавлены `river_port` / `sunken_marsh` / `ember_hills`, тесты целостности графа)
- [x] Новые сцены/квесты под `ITEM_TEMPLATE_CATALOG` и i18n `item.tpl.*` (генератор использует каталог как source-of-truth, префиксы квест-паков, доменные тесты)

## Phase POLISH — графика, EN, ESLint, перф

- [x] **LOD** instanced-декора при смене чанка + профиль FPS на low/balanced/high (EMA FPS по tier в telemetry)
- [x] **Полный EN** для процедурного текста движка (паритет ключей `ru/en` тестом `translationsParity`)
- [x] Зачистка **`exhaustive-deps`** ESLint в горячих файлах (аудит: активных предупреждений в текущем конфиге не обнаружено)
- [x] Пресеты теней / бюджет shadow map (см. `docs/orchestrate/perf-budgets.json`) — tier shadow map + weak-GPU fallback

---

## DECISIONS LOG

*(Дублируйте сюда текст из комментариев `// DECISION: …` в коде после значимых коммитов.)*

| Дата | Решение | Альтернатива (отклонена) |
|------|---------|---------------------------|
| 2026-05-14 | Слухи в worker: расширен порог `hours×count` (`RUMOR_WORKER_MIN_WORKLOAD`); ответ worker с несовпадающим `token` → `null` + sync fallback; документация `world-social-graphics.md` / ADR 0005. | Профилирование wall-time на каждом тике |
| 2026-05-14 | HUD **EnemyCoalitionBar** над футером + открытие панели «Мир» на вкладке коалиций по счётчику `coalitionFocusTrigger`; кнопка «Мир» в футере с лёгким ring при активных коалициях. | Отдельный модальный слой только для коалиций |
| 2026-05-10 | Lethal panel combat uses **same NPC id rules** as `defeat_enemy` (`isNpcEligibleForGeneratedDefeatObjective`) so story-critical ids never get `markNpcDead` from quick fight; non-lethal win = stats + journal only. | Separate combat kill-list |
| 2026-05-10 | Граф локаций: ребро **misty_crossroads ↔ old_ruins** (торговый коридор); караван `misty_ruins_triangle`; контракт маршрутов — `assertTradeRoutesMatchLocationGraph` + тест. | Маршруты без проверки рёбер (риск рассинхрона со слухами) |
| 2026-05-10 | Экономика караванов: константы `caravanEconomyConstants`; `readMarketSupplyForLocation` / `marketToneFromSupply`; полоса рынка в `ShopPanel`; тест `caravanSupplyIntegration` (тик караванов → supply). | Отдельное хранилище supply вне `factionPowers` |
| 2026-05-14 | Источник истины локаций вынесен в `storyLocations`; travel guard проверяет ребро графа; добавлены 3 региона и тесты `storyLocations`. | Хранить граф только внутри `useGameState` и дублировать по тестам |
| 2026-05-14 | Контент-квесты привязаны к `ITEM_TEMPLATE_CATALOG` (collect_item target + item_gain) и к префиксам пакетов `caravan_supply/marsh_route/ridge_conflict`; тест `aiStoryEngine.content`. | Ручные списки ключей в генераторе (риск drift с каталогом) |
| 2026-05-14 | Графика: shadow map preset по tier + weak-GPU fallback, телеметрия FPS с EMA по tier. | Единый shadow preset без деградации для слабых CPU/GPU |
| 2026-05-14 | NPC-память ограничена (`CHRONOS_NPC_MEMORY_MAX=120`) и релевантность памяти ранжируется по importance/термам/свежести; добавлены тесты `npcSystem.memory`. | Бесконечный рост памяти NPC и простая фильтрация `includes(context)` |
| 2026-05-14 | Слухи/караваны в `advanceTime` синхронизированы по порядку в sync и worker ветках: spread -> caravans -> market supply (единая причинная последовательность). | Разный порядок шагов при heavy/light tick и дрейф итогового охвата |
| 2026-05-14 | WebLLM cache key расширен состоянием NPC (`relationship`, `mentalState`, top memories, квестные счётчики) для снижения устаревших реплик; версия ключа `v3`. | Кэш только по world hash + message, риск неактуального тона при смене отношений |
| 2026-05-14 | Отбор памяти в system prompt LocalAI ранжируется по релевантности к текущей реплике игрока (`playerMessage`), а не только по свежести. | Передача в LLM последних записей без учёта темы запроса |
| 2026-05-14 | Добавлен доменный `deterministicRng` (seed/string) + тесты, как базовый кирпич replay-детерминизма для соц/экономических тиков. | Оставить все эмерджентные подсистемы на неуправляемом `Math.random` |
| 2026-05-14 | Для 3D `high` tier dpr ограничен до 1.5 (вместо 2) для согласования с perf budget и снижения GPU spikes. | Сохранить dpr до 2 и принимать нестабильный FPS на части устройств |

---

## История правок вех

- [x] Инициализация файла и плагина `autonomous-session` (Orchestrate).
