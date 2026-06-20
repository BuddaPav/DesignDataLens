---
name: gossip-propagator
description: Manage rumor and gossip spreading system. Use when NPCs share information.
---

# Gossip Propagator

## When to use this skill

- NPC information sharing
- Rumor mechanics
- News spreading

## Gossip System

```typescript
interface Gossip {
  id: string
  content: string
  source: string
  ttl: number // days
  spreadRadius: number
}
```

## Spread Logic

- TTL-based decay
- Trust-based spread
- Location proximity

## Cross-references

- [[npc-generator]] - NPC generation
- [[memory-archiver]] - Memory