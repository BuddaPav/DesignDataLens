---
name: npc-generator
description: Generate NPCs from templates. Use when creating new NPCs.
---

# NPC Generator

## When to use this skill

- Creating NPCs
- NPC type generation
- Personality assignment

## NPC Types

- villager
- merchant
- guard
- noble
- quest_giver

## Generation Pattern

```typescript
const createNPC = (type: NPCType): NPC => ({
  id: generateId(),
  type,
  personality: generatePersonality(type),
  location: randomLocation(),
  relations: {},
  memory: [],
})
```

## Cross-references

- [[personality-model]] - Personality
- [[dialogue-builder]] - Dialogue