---
name: memory-archiver
description: Manage NPC memory and recall. Use when NPCs remember player interactions.
---

# Memory Archiver

## When to use this skill

- NPC memory storage
- Event recall
- Relationship tracking

## Memory Types

| Type | Duration |
|------|----------|
| transient | minutes |
| episodic | hours/days |
| long_term | permanent |

## Structure

```typescript
interface NPCMemory {
  id: string
  type: MemoryType
  content: string
  timestamp: number
  importance: number
  relatedNPCs: string[]
}
```

## Cross-references

- [[npc-generator]] - NPC generation
- [[gossip-propagator]] - Gossip