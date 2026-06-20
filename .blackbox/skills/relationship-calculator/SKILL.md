---
name: relationship-calculator
description: Calculate NPC-to-NPC relationships. Use when tracking NPC relations.
---

# Relationship Calculator

## When to use this skill

- NPC relationship calc
- Trust tracking
- Reputation changes

## Relationship Components

| Component | Range | Weight |
|-----------|-------|--------|
| trust | 0-100 | 0.4 |
| respect | 0-100 | 0.3 |
| familiarity | 0-100 | 0.3 |

## Calculation

```typescript
const calculate = (npcA: NPC, npcB: NPC): number => {
  const trust = npcA.relations[npcB.id] ?? 50
  const respect = ...
  return trust * 0.4 + respect * 0.3 + familiarity * 0.3
}
```

## Cross-references

- [[faction-manager]] - Factions
- [[memory-archiver]] - Memory