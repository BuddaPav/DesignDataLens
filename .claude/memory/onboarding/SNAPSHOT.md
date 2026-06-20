# Quick Start для нового разработчика

## One-Command Setup
```bash
cd app && npm install && npm run dev
```

## Architecture
- React + Three.js (R3F) frontend
- In-memory game state
- Vector DB for NPC memory (future)

## Key Files
- `src/components/game/WorldScene3D.tsx` - 3D рендер
- `src/engine/NPCSystem.ts` - AI NPC логика
- `src/hooks/useGameState.ts` - Состояние игры
- `src/domain/economy/` - Экономика

## Commands
```bash
npm run dev     # Development server
npm run build  # Production build
npm test      # Run tests
```

## Тесты покрытия
- Domain logic: high coverage
- UI components: manual testing

## Known Issues
- None currently

## Геймплей
1. Создать персонажа
2. Исследовать мир
3. Взаимодействовать с NPC
4. Копить ресурсы
5. Прокачиваться