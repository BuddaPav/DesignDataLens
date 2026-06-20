---
name: mock-fabricator
description: Create mock data for tests. Use when setting up test fixtures.
---

# Mock Fabricator

## When to use this skill

- Creating test fixtures
- Mocking dependencies
- Setting up game state for tests

## Mock Pattern

```typescript
export const createMockNPC = (overrides = {}): NPC => ({
  id: 'npc_test',
  name: 'Test NPC',
  type: 'villager',
  status: 'alive',
  location: { x: 0, y: 0 },
  relations: {},
  memory: [],
  personality: { traits: [] },
  ...overrides,
})
```

## Game State Mocks

```typescript
export const createMockGameState = (): GameState => ({
  phase: 'main_game',
  player: createMockPlayer(),
  npcs: {},
  world: createMockWorld(),
  economy: createMockEconomy(),
  relations: {},
  worldTiles: [],
  activeCaravans: [],
  delayedConsequences: [],
})
```

## Cross-references

- [[test-generator]] - Test generation
- [[code-scaffold]] - Component scaffolding