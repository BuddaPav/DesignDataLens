---
name: dialogue-builder
description: Build dialogue trees for NPCs. Use when creating NPC conversations.
---

# Dialogue Builder

## When to use this skill

- Creating dialogue
- Conversation trees
- Response options

## Dialogue Structure

```typescript
interface DialogueNode {
  text: string
  options: DialogueOption[]
  next?: string
}
```

## Cross-references

- [[npc-generator]] - NPC generation
- [[ai-behaviour-tree]] - Behaviour