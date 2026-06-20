---
name: loot-generator
description: Generate loot drops and rewards. Use when creating random loot.
---

# Loot Generator

## When to use this skill

- Random loot generation
- Enemy drops
- Chest contents

## Loot Tables

```typescript
interface LootTable {
  id: string
  entries: LootEntry[]
}

interface LootEntry {
  item: string
  minQty: number
  maxQty: number
  weight: number
  conditions?: Condition[]
}
```

## Cross-references

- [[item-generator]] - Items
- [[inventory-manager]] - Inventory