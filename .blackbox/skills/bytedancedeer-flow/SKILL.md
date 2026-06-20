---
name: bytedancedeer-flow
description: Data flow and state management patterns for Chronos game. Use when architecting new features or debugging state issues.
---

# Bytedancedeer Flow

## When to use this skill

- New state management needs
- Debugging state propagation
- Cross-component communication
- Persistent game state (IndexedDB)

## Architecture Overview

```
UI (components/) → hooks/ (useGameState) → engine/ → domain/ → types/
```

## State Layers

### 1. UI State (React)
```typescript
// Local component state
const [localState, setLocalState] = useState(initial)
```

### 2. Game State (useGameState hook)
```typescript
// Centralized in hooks/useGameState.ts (1897 lines)
const { gameState, dispatch } = useGameState()
```

### 3. Engine State (engine/)
```typescript
// NPCSystem, AIStoryEngine, GossipNetwork
const worldState = simulateWorld(gameState)
```

### 4. Domain State (domain/)
```typescript
// Economy, consequences, persistence
const consequence = applyChoice(gameState, choice)
```

### 5. Persistent State (IndexedDB)
```typescript
// Save/load via IndexedDB
const saveData = await persistState(gameState)
```

## Key State Files

| File | Responsibility |
|------|----------------|
| hooks/useGameState.ts | Central game state |
| engine/NPCSystem.ts | NPC simulation |
| engine/gossipNetwork.ts | Rumor propagation |
| engine/traderCaravan.ts | Trade routes |
| domain/economy/ | Economy logic |

## Data Flow Patterns

### Action → Consequence → State Update

```typescript
// 1. Player action
const action = { type: 'TALK_TO_NPC', npcId: 'npc_001' }

// 2. Engine processes
const consequence = applyChoiceConsequences(gameState, action)

// 3. State updates
dispatch({ type: 'APPLY_CONSEQUENCE', payload: consequence })
```

### NPC Interaction Flow

```
Player clicks NPC
  → NPCPanel opens
  → AIStoryEngine generates dialogue
  → Player responds
  → applyChoiceConsequences
  → gossipSpread (optional)
  → World updates
```

### Trade Flow

```
Shop opens
  → caravanEconomy loads prices
  → Player purchases
  → shopPurchase processes
  → dispatch(UPDATE_INVENTORY)
  → caravanEconomy updates (caravans adjust routes)
```

## Game State Structure

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
```

## Cross-references

- [[supermemory]] - State persistence
- [[voltagentawesome]] - Performance
- [[jwilgeragent-skills]] - Development workflow