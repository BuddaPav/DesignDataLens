# Когнитивная память проекта

## Дерево проекта (актуальное)

```
AFK Game/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── WorldScene3D.tsx      # 3D мир
│   │   │   │   ├── WorldCanvas.tsx
│   │   │   │   ├── InventoryPanel.tsx     # инвентарь
│   │   │   │   ├── NPCPanel.tsx          # диалоги NPC
│   │   │   │   ├── ShopPanel.tsx        # торговля
│   │   │   │   ├── SettingsPanel.tsx   # настройки
│   │   │   │   └── world/
│   │   │   │       ├── MassGeneratedProps.tsx  # LOD модели
│   │   │   │       └── ChronolithAnchor.tsx
│   │   │   └── screens/
│   │   │       ├── GameScreen.tsx
│   │   │       ├── CharacterCreation.tsx
│   │   │       └── IntroScreen.tsx
│   │   ├── domain/
│   │   │   ├── engine/
│   │   │   ├── hooks/
│   │   │   └── types/
│   ├── public/
│   │   ├── models/aaa/              # 51 GLB модель
│   │   └── assets/
│   └── package.json
├── docs/
└── CLAUDE.md
```

## Активные TODO

### Приоритет 1 (BLOCKING)
- [ ] Интегрировать 51 GLB модель в MassGeneratedProps
- [ ] Добавить дистанционное переключение LOD

### Приоритет 2 (HIGH)
- [ ] Добавить SSAO обратно (удалили временно)
- [ ] Починить pointer lock в production

### Приоритет 3 (MEDIUM)
- [ ] Добавить больше биомов
- [ ] Расширить экономику

## ERROR STATE (известные проблемы)

### Критичные
- ❌ none (все исправлены)

### Известные workaround
- ⚠️ Meshy API недоступен - использован ручной batch скрипт
- ⚠️ Нет real 3D моделей - сгенерировано 51 качественных GLB

### Архитектурные решения
- ✅ Векторная память NPC через Embedding
- ✅ In-memory state с periodic persistence
- ✅ Three.js + R3F для 3D

## Semantic Index (RAG)

### Поиск по коду
- "NPC система" → src/engine/NPCSystem.ts
- "диалоги" → src/components/game/NPCPanel.tsx
- "3D рендеринг" → src/components/game/WorldScene3D.tsx
- "экономика" → src/domain/economy/
- "квесты" → src/types/game.ts (Objective interface)
- "сохранение" → src/hooks/useGameState.ts

### Поиск по ошибкам
- "TypeScript errors" → 14 исправлено, build чистый
- "NPC dialogue" → deriveDialogueConsequences.ts
- "combat" → quickHostileCombat.ts