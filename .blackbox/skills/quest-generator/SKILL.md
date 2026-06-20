---
name: quest-generator
description: Generate quests and missions. Use when creating game quests.
---

# Quest Generator

## When to use this skill

- Quest creation
- Mission design
- Reward calculation

## Quest Types

| Type | Difficulty |
|------|-------------|
| fetch | Easy |
| escort | Medium |
| combat | Medium |
| puzzle | Hard |
| investigation | Hard |

## Quest Structure

```typescript
interface Quest {
  id: string
  title: string
  description: string
  objectives: QuestObjective[]
  rewards: Reward[]
  giver: string
  location?: string
}
```

## Cross-references

- [[npc-generator]] - NPC generation
- [[loot-generator]] - Rewards