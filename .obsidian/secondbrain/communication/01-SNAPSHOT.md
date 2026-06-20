---
tags: [communication, snapshot]
type: onboarding
created: 2026-06-20
updated: 2026-06-20
---
# Onboarding Snapshot

## Project: Chronos: AI Chronicles

AI-driven RPG где каждый игрок получает уникальный генерируемый сюжет.

## Architecture

```
src/
+-- components/    # UI компоненты
+-- engine/        # Ядро игры
+-- world/         # Мир, биомы
+-- entities/     # NPC, предметы
+-- rendering/    # Three.js/R3F
+-- domain/        # Бизнес-логика
+-- hooks/         # React хуки
+-- lib/           # Утилиты
+-- ui/            # UI панели
L-- types/         # TypeScript типы
```

## Key Files

| Файл | Назначение |
|------|------------|
| src/lib/featureFlags.ts | Feature flags |
| src/lib/utils.ts | Утилиты |
| src/version.ts | Версия |
| src/App.tsx | Главный компонент |
| electron/main.cjs | Electron main |

## Конвенции

- Components: PascalCase (WorldScene3D.tsx)
- Hooks: camelCase с use prefix (useGameState.ts)
- Types: PascalCase с Interface suffix
- Constants: SCREAMING_SNAKE_CASE
- No any types - использовать proper typing
- Feature flags для всех новых фич

## Quick Start

```bash
cd app
npm install
npm run dev
# > http://localhost:5173
```

## Quality Gates

1. `npm run build` must pass
2. No new TypeScript errors
3. Security scan clean (no secrets)
4. Bundle size < 500KB gzipped

## Tech Stack

- React 19 + TypeScript
- Three.js + R3F
- Tailwind CSS
- Zustand (state)
- Vite (build)
