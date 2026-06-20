# Конституция проекта AFK Game

## Philosophy & Core Principles

### Gaming Philosophy
- **AFK-first design**: Players should feel world lives even when they're away
- **Emergent narrative**: Stories emerge from NPC interactions, not scripted
- **Organic progression**: Time-based mechanics that respect player schedules
- **Ethical AI**: NPCs have genuine inner states, not just quest dispensers

### Technical Principles

### Architecture Style
- React/Three.js frontend with R3F
- Node.js/Express backend (gradual migration target: Cloudflare Workers)
- In-memory game state with periodic persistence
- Vector database for NPC memory embedding

### Coding Standards
- TypeScript strict mode, no `any`
- Feature flags for all new features
- Test coverage required for gameplay logic
- Security-first: no secrets in code, validate all input

### Prohibited Patterns
- ❌ `// TODO: fix later` without ticket reference
- ❌ Hardcoded secrets or tokens
- ❌ Synchronous calls in game loops
- ❌ Direct DOM manipulation (use R3F)
- ❌ SQL without parameterized queries

### Quality Gates
1. `npm run build` must pass
2. No new TypeScript errors
3. Security scan clean (no secrets)
4. Bundle size < 500KB gzipped

### Naming Conventions
- Components: PascalCase (WorldScene3D.tsx)
- Hooks: camelCase with use prefix (useGameState.ts)
- Types: PascalCase, Interface suffix (GameState.ts)
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case.test.ts

### Decision Trail (Known Trade-offs)
- MongoDB chosen over PostgreSQL for: flexible NPC schemas, easier player state evolution
- Three.js chosen over Babylon for: larger ecosystem, better R3F integration
- In-memory chosen over Redis for: simpler local dev, can migrate later

### Context Windows
- Max 5 active quests tracked in HUD
- NPC awareness radius: 3 tiles
- World tick rate: 1 second (configurable)
- Max concurrent NPC dialogues: 3