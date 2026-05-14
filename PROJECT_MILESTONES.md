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
- [ ] Worker/изоляция тяжёлого расчёта слухов при больших `hours` (без рассинхрона сохранений)
- [ ] UI коалиций врагов, связанный с повседневным геймплеем (не только `WorldStatusPanel`)

## Phase CONTENT — локации, квесты, процедурный нарратив

- [x] Движок сюжета, квесты, шаблоны сцен (`AIStoryEngine`, последствия `applyChoiceConsequences`)
- [ ] Расширение маршрутов караванов и привязка к экономике (новые локации, несколько караванов)
- [ ] Новые сцены/квесты под `ITEM_TEMPLATE_CATALOG` и i18n `item.tpl.*` (пакетами, с тестами домена где нужно)

## Phase POLISH — графика, EN, ESLint, перф

- [ ] **LOD** instanced-декора при смене чанка + профиль FPS на low/balanced/high
- [ ] **Полный EN** для процедурного текста движка (ключи + генераторы строк)
- [ ] Зачистка **`exhaustive-deps`** ESLint в горячих файлах (только где безопасно)
- [ ] Пресеты теней / бюджет shadow map (см. `docs/orchestrate/perf-budgets.json`)

---

## DECISIONS LOG

*(Дублируйте сюда текст из комментариев `// DECISION: …` в коде после значимых коммитов.)*

| Дата | Решение | Альтернатива (отклонена) |
|------|---------|---------------------------|
| 2026-05-10 | Lethal panel combat uses **same NPC id rules** as `defeat_enemy` (`isNpcEligibleForGeneratedDefeatObjective`) so story-critical ids never get `markNpcDead` from quick fight; non-lethal win = stats + journal only. | Separate combat kill-list |

---

## История правок вех

- [x] Инициализация файла и плагина `autonomous-session` (Orchestrate).
