---
name: type-generator
description: Generate TypeScript types from JSON schemas, API responses, or domain models. Use when defining data structures.
---

# Type Generator

## When to use this skill

- Creating types for API responses
- Defining game data structures
- Generating types from JSON schemas
- Converting domain models to TypeScript

## Basic Types

```typescript
// Primitive types
type ID = string
type Timestamp = number
type GamePhase = 'intro' | 'character_creation' | 'tutorial' | 'main_game' | 'ending'
type EmotionState = 'neutral' | 'excited' | 'frustrated' | 'curious' | 'bored' | 'stressed' | 'relaxed'
type NPCStatus = 'alive' | 'dead' | 'missing' | 'imprisoned' | 'exiled'
type BiomeKind = 'deep_water' | 'shallow' | 'beach' | 'plains' | 'forest' | 'hills' | 'mountain' | 'snow' | 'desert' | 'ruins'
```

## Game State Types

```typescript
interface GameState {
  phase: GamePhase
  player: Player
  npcs: Record<string, NPC>
  world: WorldState
  economy: EconomyState
  relations: RelationMap
  worldTiles: TileData[]
  activeCaravans: Caravan[]
  delayedConsequences: DelayedConsequence[]
}

interface Player {
  id: ID
  name: string
  level: number
  hp: number
  maxHp: number
  inventory: Item[]
  location: Location
  skills: string[]
}

interface NPC {
  id: ID
  name: string
  type: string
  personality: Personality
  status: NPCStatus
  location: Location
  relations: Record<ID, number>
  memory: NPCMemory[]
  faction?: string
}

interface WorldState {
  tiles: TileData[]
  time: number
  weather: Weather
  landmarks: Landmark[]
}

interface EconomyState {
  gold: number
  prices: Record<string, number>
  activeTrades: Trade[]
}
```

## Utility Types

```typescript
// Generic utilities
type Nullable<T> = T | null
type Optional<T> = T | undefined
type AsyncResult<T> = Promise<Result<T, Error>>
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
```

## Cross-references

- [[schema-validator]] - Schema validation
- [[api-contract]] - API contracts
- [[code-scaffold]] - Component scaffolding