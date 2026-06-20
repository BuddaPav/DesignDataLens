---
name: supermemoryaisupermemory
description: Long-term memory and context preservation for Chronos. Use when maintaining session context, persisting state, or building AI memory systems.
---

# Supermemory for AFK Game

## When to use this skill

- Maintaining context across sessions
- Persisting game state
- Building NPC memory systems
- Saving/loading game progress
- Context continuity for AI agents

## Memory Systems in AFK Game

### 1. Player Memory (saveSystem.ts)
```typescript
import { saveToIndexedDB, loadFromIndexedDB } from '../engine/saveSystem'

// Save
await saveToIndexedDB('player_save', gameState)

// Load
const saved = await loadFromIndexedDB('player_save')
```

### 2. NPC Memory (MemorySystem.ts)
```typescript
class MemorySystem {
  remember(npcId: string, event: MemoryEvent): void
  recall(npcId: string): MemoryEvent[]
  forgetOlderThan(npcId: string, hours: number): void
}
```

### 3. Rumor Memory (gossipSpreadPure.ts)
- Rumors have TTL (time-to-live)
- Confidence decays over time
- Location-based spread

### 4. Agent Memory (Obsidian)
```typescript
// Sync with Obsidian vault
import { obsidianSync } from '../scripts/obsidian-sync.mjs'

// Start session
await obsidianSync.pull()  // Load Agent Memory.md

// End session
await obsidianSync.push() // Update Progress Log.md
```

## Context Preservation

### Session Start
```bash
npm run obsidian:pull  # Load context from Obsidian
```

### Session End
```bash
npm run obsidian:push  # Save progress
```

## Memory Categories

| Type | Storage | TTL |
|-----|---------|-----|
| Player saves | IndexedDB | Forever |
| NPC memories | In-memory | Configurable |
| Rumors | In-memory | Hours/Days |
| Agent context | Obsidian | Forever |

## Cross-references

- [[affaan-mecc]] - Architecture
- [[everyinccompound-engineering]] - Feature compounding
- [[context-continuity-guardian]] - Context preservation