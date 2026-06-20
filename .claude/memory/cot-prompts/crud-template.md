# Chain of Thought Промпты

## CRUD Template
```
Шаблон для создания новой сущности:
1. Определить тип в src/types/game.ts
2. Добавить в интерфейс Player/WorldState
3. Создать CRUD в src/domain/
4. Добавить UI в components/
5. Добавить тесты в __tests__/
```

## NPC Generation
```
1. Определить archetype (merchant, quest-giver, etc)
2. Создать mental state (stress, happiness, trauma)
3. Написать dialogue tree
4. Интегрировать в NPCSystem
5. Добавить в world tiles
```

## World Generation
```
1. Выбрать biome type
2. Определить props (trees, rocks, etc)
3. Настроить LOD levels
4. Добавить в MassGeneratedProps
5. Валидировать в WorldScene3D
```

## Combat System
```
1. Определить enemy type
2. Настроить stats (hp, damage, etc)
3. Добавить loot table
4. Интегрировать в quickHostileCombat
5. Добавить UI feedback
```

## Economy Balance
```
1. Определить item category
2. Установить base price
3. Добавить merchant markup
4. Настроить supply/demand
5. Валидировать с caravanEconomy
```