---
name: faction-manager
description: Manage NPC factions and alliances. Use when tracking faction relationships.
---

# Faction Manager

## When to use this skill

- Faction creation
- Alliance tracking
- Conflict resolution

## Faction Structure

```typescript
interface Faction {
  id: string
  name: string
  align: 'good' | 'neutral' | 'evil'
  relations: Record<string, number>
  members: string[]
}
```

## Relationship Levels

| Value | Relationship |
|-------|---------------|
| -100 | War |
| -50 | Hostile |
| 0 | Neutral |
| 50 | Friendly |
| 100 | Ally |

## Cross-references

- [[npc-generator]] - NPC generation
- [[relationship-calculator]] - Relations