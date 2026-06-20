---
name: affaan-mecc
description: Game architecture and development patterns for Chronos AI Chronicles. Use when designing new features, refactoring code, or building modular systems.
---

# AFK Game Architecture

## When to use this skill

- Designing new game systems
- Refactoring useGameState.ts or other large files
- Adding new NPC/dialogue systems
- Building modular game features
- Implementing trade/economy systems

## Game Architecture Patterns

### Layered Architecture

```
UI (components/) → hooks/ → engine/ → domain/ → types/
```

Each layer should only import from layers below it.

### Key Systems

#### 1. NPC System (NPCSystem.ts)
```typescript
class NPCSystem {
  initializeNPCs(): void
  createNPCFromTemplate(template: NPCTemplate): NPC
  generateSchedule(npcId: string): NPCSchedule
  updateRelationshipValues(event: RelationshipEvent): void
}
```

#### 2. Rumor Market
- Pure functions in `gossipSpreadPure.ts`
- Worker in `gossipSpread.worker.ts`
- Network orchestration in `gossipNetwork.ts`

#### 3. Trade Routes
- 8 predefined routes in `traderCaravan.ts`
- Market economy in `caravanEconomy.ts`

### State Management

Use the hook pattern:
```typescript
export function useGameState() {
  const [state, setState] = useState<GameState>(initialState)
  // All game logic here
  return { state, setState }
}
```

### NPC Dialogue

WebLLM integration:
```typescript
import { LocalAIManager } from '../engine/localAI'

const ai = getLocalAIManager()
await ai.generateResponse(npc, playerMessage)
```

## Examples

### Adding new NPC type
```typescript
// 1. Add type to types/game.ts
type NPCArchetype = 'merchant' | 'quest_giver' | 'lore_keeper'

// 2. Add template in NPCSystem.ts
const NPC_TEMPLATES: Record<NPCArchetype, NPCTemplate> = {
  merchant: { profession: 'trader', goods: [...] },
  // ...
}

// 3. Add dialogue in dialogueSystem.ts
function handleMerchantDialogue(npc: NPC, message: string): string {
  // Shop interface
}
```

### Adding new world event
```typescript
// 1. Add to worldEvents.ts
export interface WorldEvent {
  id: string
  title: { ru: string; en: string }
  triggersQuestId?: string
}

// 2. Add rarity in roadEvents.ts
const ROAD_EVENTS: RoadEvent[] = [...]
```

## Anti-patterns

- ❌ Direct engine imports in UI components
- ❌ Large hooks > 1000 lines
- ❌ Multiple state sources
- ❌ Global mutable state

## Cross-references

- [[narrative-causality-architect]] - Story causality
- [[supermemory]] - Memory management
- [[everyinccompound-engineering]] - Feature compounding