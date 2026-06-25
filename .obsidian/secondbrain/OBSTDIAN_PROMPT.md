# Полный промт для AI ассистента о проекте Chronos AI Chronicles

---

## О ПРОЕКТЕ

**Название:** Chronos AI Chronicles (AFK Game)
**Тип:** Революционная AI-driven RPG игра AAA-класса
**Концепция:** Каждый игрок получает полностью уникальный сюжет, генерируемый в реальном времени на основе выборов, эмоций и стиля игры.
**Класс разработки:** AAA (Triple-A) — высокий бюджет, полная команда, многолетняя разработка

---

## ВТОРОЙ МОЗГ (LLM BRAIN SYSTEM)

### Общая концепция

"Второй мозг" — это автономная система AI-агентов, которая САМА разрабатывает игру. Это не просто инструмент, а **цифровой разработчик** который:
- Пишет код
- Исправляет баги
- Создаёт контент
- Генерирует NPC и квесты
- Делает коммиты в git
- Откатывает изменения при ошибках

### Архитектура Второго мозга

Файл: `ai_support/llm_brain.ts`

**5 слоёв агентов (всего 39 агентов):**

#### Layer 1: Base Agents (15 агентов) — локальные модели
- `codeBuilder` — написание кода (Qwen 2.5 Coder)
- `codeReviewer` — ревью кода (Llama 3)
- `npcArchitect` — создание NPC (Qwen 2.5)
- `npcPsychologist` — психология NPC (Llama 3)
- `worldBuilder` — построение мира (Qwen 2.5)
- `worldManager` — управление миром (Llama 3)
- `economyDesigner` — экономика (Qwen 2.5)
- `traderEngine` — торговля (Qwen)
- `combatEngine` — бой (Qwen 2.5)
- `questGiver` — квесты (Llama 3)
- `dialogueMaster` — диалоги (Qwen 2.5)
- `uiCraftsman` — UI (Llama 3)
- `securityAuditor` — безопасность (Llama 3)
- `testEngine` — тесты (Llama 3)
- `docsWriter` — документация (Llama 3)

#### Layer 2: Meta Agents (8 агентов) — стратегия
- `metaArchitect` — архитектура системы
- `ruleOptimizer` — оптимизация правил
- `conceptRefiner` — уточнение концепций
- `promptTuner` — настройка промптов
- `performanceMonitor` — мониторинг перформанса
- `qualityGate` — проверка качества
- `costOptimizer` — оптимизация стоимости
- `fallbackManager` — управление откатами

#### Layer 3: Self-Improvement (6 агентов) — самосовершенствование
- `selfAnalyzer` — анализ прошлых задач
- `strategyPicker` — выбор стратегии
- `priorityAgent` — приоритизация задач
- `learningAgent` ��� обучение на статистике
- `adaptationAgent` — адаптация под юзера
- `evolutionAgent` — эволюция системы

#### Layer 4: Integration (5 агентов)
- `director` — дирижёр (координирует агентов)
- `consensus` — синтез результатов
- `validator` — валидация результатов
- `orchestrator` — оркестрация задач
- `healthMonitor` — мониторинг здоровья

#### Layer 5: Autonomy (5 агентов)
- `autonomousRunner` — автономное выполнение
- `selfHealer` — самолечение при ошибках
- `selfDeployer` — автодеплой
- `selfTester` — автотестирование
- `selfReporter` — автоотчётность

### LLM Провайдеры и Реестр

Файл: `ai_support/llm_brain.ts` (строки 19-44)

```typescript
const LLM_REGISTRY = [
  // Бесплатные (локальные)
  { id: 'nemotron', provider: 'nvidia', model: 'nemotron-3-nano', strengths: ['code', 'reasoning'], available: true },
  { id: 'deepseek', provider: 'nvidia', model: 'deepseek-v4-pro', strengths: ['math', 'logic'], available: true },
  { id: 'llama3', provider: 'ollama', model: 'llama3', strengths: ['general'], available: true },
  { id: 'qwen', provider: 'ollama', model: 'qwen2.5:7b', strengths: ['code', 'reasoning'], available: true },
  { id: 'qwen2', provider: 'ollama', model: 'qwen2.5-coder:7b', strengths: ['code'], available: true },

  // Платные (нужен API ключ)
  { id: 'gpt4o', provider: 'openai', model: 'gpt-4o', strengths: ['code', 'creative'], cost: 2.5, available: false },
  { id: 'claude-sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet', strengths: ['code', 'analysis'], cost: 3, available: false },

  // Бесплатные API (с лимитами)
  { id: 'hf', provider: 'hf', model: 'meta-llama/Llama-3.1-8B-Instruct', strengths: ['general'], available: true },
];
```

### Память Второго мозга

Файлы в `ai_support/secondbrain/`:

- `brain_rules.json` — правила и паттерны
- `task_history.json` — история задач (последние 1000)
- `agent_stats.json` — статистика агентов (success/fail)
- `state.json` — текущее состояние
- `memory.json` — долгосрочная память
- `metrics.json` — метрики системы

### Функции памяти

```typescript
// Загрузка/сохранение
loadRules() → { patterns, rules, learned }
saveRules(rules)
loadTaskHistory() → TaskHistory[]
saveTaskResult(task, result, agent, llm)
loadStats() → { agentId: { success, fail } }
updateStats(agentId, 'success' | 'fail')
loadState() → { active, lastTask }
loadMemory() → { shortTerm, longTerm }

// Самооптимизация
applyImprovements(analysis: string) // применяет RULE:NAME=VALUE из анализа
```

###Self-Improvement Цикл

```
1. autonomousRunner выполняет задачу
2. Результат сохраняется в task_history
3. stats обновляются (success/fail)
4. selfAnalyzer смотрит последние 50 задач
5. Предлагает IMPROVE: правила
6. applyImprovements обновляет brain_rules
7. Система становится лучше
```

---

## AAA СТАНДАРТЫ РАЗРАБОТКИ ИГРЫ

### Графические стандарты

Из файла `docs/architecture/world-social-graphics.md`:

**3 Tier системы графики:**

| Параметр | Low | Balanced | High |
|----------|-----|----------|------|
| Shadows | 512px | 1024px | 2048px |
| DPR cap | 1.0 | 1.25 | 1.5 |
| Water segments | 32 | 64 | 128 |
| PostFX | minimal | bloom+noise | full+god rays |
| Particle density | low | medium | high |

**Post-обработка (High tier):**
- Bloom
- God rays (нулевой вес на low)
- Film grain noise
- Chromatic aberration
- Hue & saturation (колористика по эпохе)
- Vignette
- ACES tone mapping
- SMAA antialiasing

**Вода:**
- Псевдо-отражения через reflect()
- Градиент неба (zenith ↔ horizon)
- Сила отражения по tier
- Сегменты сетки по tier

### Архитектура рендера

```
WorldScene3D
├── WorldLighting (shadows по tier)
├── WorldTerrain (по высоте)
├── WaterSurface (отражения)
├── WorldPostFX (post-processing)
└── FPS-telemetry (EMA по tier)

WorldCanvas (2D карта)
└── Relief layer (ridge/cliff lighting)
```

### Социум и NPC

**Отношения NPC (5 метрик):**
- Trust (0-100) — доверие к игроку
- Affection (0-100) — симпатия/антипатия
- Respect (0-100) — уважение
- Fear (0-100) — страх
- Loyalty (0-100) — верность

**Big Five Personality Model:**
- Openness — открытость новому
- Conscientiousness — добросовестность
- Extraversion — экстраверсия
- Agreeableness — дружелюбие
- Neuroticism — эмоциональность

**NPC память:**
- Short-term — последние 10 действий
- Medium-term — ключевые события сессии
- Long-term — важные выборы и отношения
- Episodic — полная история

### Экономика

**Системы:**
- Магазины с динамическими ценами
- Рынок с supply/demand
- Караваны между локациями
- Фракционная репутация

**Торговые маршруты:**
```
- willbrook_ring
- ruins_forest_shuttle
- crossroads_loop
- village_ruins_spine
- misty_ruins_triangle
- delta_marsh_run
- ashen_ridge_line
- frontier_chain
```

### Слухи и Граф

**Система слухов:**
- TTL (time-to-live) затухание
- Охват по рёбрам графа локаций
- Фракционные теги
- Караванное усиление

**Gossip Worker:**
- Выполнение в Web Worker
- fallback на синхронный режим
- Детерминированный replay через randomFn injection

---

## ВИДЕНИЕ ИГРЫ В ПОЛНЫХ КРАСКАХ

### Сеттинг

**Мир:** Фэнтезийное королевство с элементами стимпанка
**Эпоха:** Раннее средневековье + магическая индустрия
**Стиль:** Тёмное фэнтези с атмосферой Morrowind + Disco Elysium

### Визуальный стиль

**Освещение:**
- Тёплые тона костров и факелов
- Холодные лунные оттенки
- Контрастные тени
- Атмосферный туман

**Цветовая палитра:**
- Primary: Deep browns, forest greens
- Accent: Gold, ember orange
- UI: Parchment, dried blood red
- Magic: Cyan glow, purple haze

**Типографика:**
- Заголовки: Cormorant Garamond (medieval serif)
- Body: Source Sans Pro
- UI: Inter с кастомными символами

### Геймплей

**Core Loop:**
1. Исследуй мир
2. Встречай NPC
3. Заводи отношения
4. Принимай решения
5. Влияй на мир
6. Получай последствия
7. Повторяй (бесконечно)

**AFK Mechanic:**
- Мир живёт пока игрока нет
- NPC делают дела
- Слухи распространяются
- Караваны ездят
- События случаются

**Эмоциональная адаптация:**

| Паттерн игрока | Реакция мира |
|----------------|-------------|
| Быстрые клики | Больше экшена |
| Частые смерти | Подсказки, упрощение |
| Исследование | Больше лора, тайн |
| Бездействие | Интригующий хук при возврате |

### NPC

**Каждый NPC — личность:**
- Уникальная внешность
- Личная история
- Секреты
- Цели и мотивации
- Мнения о мире
- Отношения с другими NPC

**Диалоги:**
- Контекстуальные
- Эмоционально окрашенные
- С намёками
- С юмором (когда уместно)

### Квесты

**Типы:**
- Main — главная сюжетная линия
- Side — процедурные квесты
- Character — истории NPC
- World — глобальные события
- Personal — 基于选择Player

**Система выборов:**
- Видимые последствия
- Скрытые последствия
- Долгосрочное влияние
- Множественные концовки

### Аудио (план)

**Музыка:**
- Динамическая (по ситуации)
- Тематические треки локаций
- Эмоциональные переходы

**SFX:**
- 环境ный звук
- UI sounds
- Бовая музыка
- Ambient NPC

---

## ЧТО Я ХОЧУ

Я хочу создать **настоящую AAA игру**, где:

### Обязательные элементы
1. **Графика AAA-класса** — post-FX, динамический свет, вода
2. **Живой мир** — NPC живут своей жизнью 24/7
3. **Бесконечный контент** — AI генерирует всё на лету
4. **Эмоциональный отклик** — игра чувствует игрока
5. **Автономная разработка** — Второй мозг делает 80% работы

### Метрики успеха
- D1 retention: 45%+
- D7 retention: 15%+
- D30 retention: 8%+
- Средняя сессия: 25+ минут
- Конверсия: 5%+

### В чём уникальность
- Нет двух одинаковых игр
- Каждый игрок — главный герой своей истории
- NPC запоминают ВСЁ
- Мир меняется НАВСЕГДА

---

## ТЕКУЩИЙ СТЕК

- **Frontend:** React + TypeScript + Three.js (R3F)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Backend:** Node.js/Express (миграция на Cloudflare Workers)
- **Хранение:** In-memory с periodic persistence
- **Build:** Vite
- **DevOps:** AI агенты (Второй мозг)

---

## ЧТО Я ХОЧУ

Я хочу создать игру, где:
1. **NPC живут своей жизнью** — помнят игрока, формируют мнение, заводят отношения между собой
2. **Мир эволюционирует** — время идёт даже когда игрок оффлайн
3. **Бесконечный сюжет** — история генерируется AI на лету
4. **Эмоциональная адаптация** — игра чувствует настроение игрока и подстраивается
5. **Автономная разработка** — AI агенты сами пишут код, исправляют баги, делают коммиты

---

## ТЕКУЩИЙ СТЕК

- **Frontend:** React + TypeScript + Three.js (R3F)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Backend:** Node.js/Express (миграция на Cloudflare Workers)
- **Хранение:** In-memory с периодической персистенцией
- **Build:** Vite

---

## СТАНДАРТЫ КОДА

Из файла `CLAUDE.md`:
- TypeScript strict mode, **без `any`**
- Feature flags для всех новых фич
- Тесты для gameplay логики
- Нет `// TODO: fix later` без тикета
- `npm run build` должен проходить
- Bundle size < 500KB gzipped
- Директории:
  - `app/src/engine/` — игровой движок
  - `app/src/domain/` — доменная логика
  - `app/src/components/` — React компоненты
  - `app/src/hooks/` — хуки
  - `app/src/types/` — типы

---

## ЧТО УЖЕ СДЕЛАНО

### 1. AI Оркестратор
- Файл: `ai_support/agents/autonomousOrchestrator.ts`
- 7 агентов: codeBuilder, npcArchitect, worldBuilder, economyDesigner, uiCraftsman, documentationGenerator, securityAuditor
- 6 LLM провайдеров: nvidia, hf, openai, anthropic, ollama, lmstudio
- Таск-менеджмент с retry логикой
- Git интеграция с build gate

### 2. Build Gate
- `runBuildCheckForce()` — удаляет dist перед билдом чтобы гарантировать fresh build
- `tryGitCommit()` — проверяет билд перед коммитом, откатывает при ошибках

### 3. NPC System
- Файл: `app/src/engine/NPCSystem.ts`
- Отношения: Trust, Affection, Respect, Fear, Loyalty (0-100)
- Память: Short-term, Medium-term, Long-term
- Big Five personality model
- Диалоговая система с LLM

### 4. Экономика
- Файл: `app/src/domain/economy/`
- Магазины, рынок, цены
- Gold, inventory система

### 5. Living World
- Time-based механика
- World events
- Quest генерация

---

## КАК ПОДКЛЮЧИТЬСЯ К PROECTУ

### 1. Запуск
```bash
cd c:/Users/Den/Downloads/AFK\ Game/app
npm run dev
```

### 2. Запуск оркестратора
```bash
cd c:/Users/Den/Downloads/AFK\ Game/ai_support/agents
npx tsx autonomousOrchestrator.ts
```

### 3. API ключи
Создать файл: `ai_support/secondbrain/.env.api`

Пример:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HF_TOKEN=hf_...
NVIDIA_API_KEY=nv-...
```

### 4. Доступные провайдеры
- `openai` — GPT-4o ( дорогой, сильный)
- `anthropic` — Claude (дорогой, отличный reasoning)
- `ollama` — локальный (бесплатный, медленный)
- `lmstudio` — локальный (бесплатный)
- `nvidia` — через NVIDIA API
- `hf` — Hugging Face Llama

---

## ЧТО Я ХОЧУ ДОБАВИТЬ / ИСПРАВИТЬ

Текущие проблемы в коде (из билда):
1. `shopPurchase.ts` — Duplicate identifiers (Player, ShopItem, WorldLogEntry и др.)
2. `NPCSystem.ts` — Duplicate identifiers (NPC, Relationship), импорты типов неправильные

Требуется:
- Исправить duplicate errors
- Подключить настоящие API ключи
- Запустить оркестратор в автономном режиме

---

## АРХИТЕКТУРА AI СИСТЕМЫ

```
┌─────────────────────────────────────────┐
│     Autonomous Orchestrator            │
├─────────────────────────────────────────┤
│  LLM Providers:                        │
│  - openai, anthropic, ollama, hf      │
│                                     │
│  Agents:                             │
│  - npcArchitect (NPC логика)          │
│  - codeBuilder (сложные правки)       │
│  - economyDesigner (экономика)       │
│  - worldBuilder (мир)                │
│  - uiCraftsman (UI)                  │
│  - documentationGenerator            │
│  - securityAuditor                   │
└─────────────────────────────────────────┘
```

---

## КОНТАКТНАЯ ИНФОРМАЦИЯ

Проект находится: `c:\Users\Den\Downloads\AFK Game\`
Основная директория: `c:\Users\Den\Downloads\AFK Game\app\`
AI агенты: `c:\Users\Den\Downloads\AFK Game\ai_support\agents\`

---

## КЛЮЧЕВЫЕ ФАЙЛЫ ИСПОЛЬЗУЕМЫЕ СИСТЕМОЙ

- `ai_support/agents/autonomousOrchestrator.ts` — главный файл оркестратора
- `ai_support/secondbrain/memory.json` — память об ошибках агентов
- `ai_support/secondbrain/task_state.json` — состояние тасков
- `ai_support/secondbrain/metrics.json` — метрики
- `ai_support/secondbrain/build_log.txt` — лог билдов

---

## КОМАНДЫ ДЛЯ РАБОТЫ

```bash
# Билд
npm run build

# Запуск dev сервера
npm run dev

# Проверить TypeScript
npx tsc --noEmit

# Запустить оркестратор
cd ai_support/agents && npx tsx autonomousOrchestrator.ts

# Посмотреть статус git
git status
```

---

## ЧЕГО Я ХОЧУ ОТ AI ПОМОЩНИКА

1. Писать код строго по стандартам проекта (CLAUDE.md)
2. Не использовать any без крайней необходимости
3. Проверять билд перед коммитом
4. Использовать правильные типы из @/types/game
5. Не дублировать существующие идентификаторы
6. Фиксить баги а не обходить их
7. Думать о последствиях измене��ий

---

## ОБСИДИАН ПОДКЛЮЧЕНИЕ

Для подключения Obsidian к этому проекту:
1. Открыть Obsidian
2. Создать новое хранилище (или открыть существующую папку)
3. Указать путь к `c:\Users\Den\Downloads\AFK Game`
4. Можно использовать плагин obsidian-git для синхронизации

---

*Документ создан: 2026-06-22*
*Версия проекта: active development*