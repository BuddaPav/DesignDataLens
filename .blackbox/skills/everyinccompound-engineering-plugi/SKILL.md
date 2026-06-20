---
name: everyinccompound-engineering-plugi
description: Feature compound and plugin architecture for Chronos. Use when adding new features, extending systems, or building plugin-based architecture.
---

# Compound Engineering for AFK Game

## When to use this skill

- Adding new game features
- Extending existing systems
- Building plugin-based features
- Combining multiple systems

## Compound Pattern

Build features that compose together:

```
Feature A + Feature B = Combined Feature C
```

### Example: Quest + Factions
```typescript
// Quest system
export interface Quest {
  id: string
  factionReward?: string // Links to factionReputation
  npcGiver?: string    // Links to NPCSystem
}
```

### Example: Trade + Rumors
```typescript
// Caravan brings rumors to new locations
function tickTradeCaravans(caravans: TradeCaravan[], rumors: ActiveRumor[]) {
  for (const caravan of caravans) {
    // Spread rumors from visited locations
    addRumorToLocation(caravan.route, rumors)
  }
}
```

## Plugin Architecture

### Inventory Plugins
```typescript
import { ItemEffect, registerItemEffect } from '../domain/inventory/inventoryRules'

const healingPotion: ItemEffect = {
  id: 'healing_potion',
  onUse: (player) => { player.hp += 20 }
}

registerItemEffect(healingPotion)
```

### Quest Plugins
```typescript
export type QuestTrigger = 'location_enter' | 'npc_talk' | 'item_use' | 'combat_win'

function registerQuestTrigger(questId: string, trigger: QuestTrigger) {
  // Auto-start quest when condition met
}
```

## Feature Integration Points

| Feature | Integration Point |
|---------|-------------------|
| Combat | quickHostileCombat.ts |
| Trade | shopPurchase.ts |
| Dialogue | dialogueSystem.ts |
| World | worldTiles.ts |
| Rumors | gossipNetwork.ts |

## Cross-references

- [[affaan-mecc]] - Architecture patterns
- [[supermemory]] - Memory systems
- [[narrative-causality-architect]] - Story causality