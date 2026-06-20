---
name: inventory-manager
description: Manage player inventory and items. Use when tracking player items.
---

# Inventory Manager

## When to use this skill

- Item storage
- Stack management
-容量 tracking

## Inventory Structure

```typescript
interface Inventory {
  slots: number
  items: Item[]
  gold: number
}
```

## Operations

- Add/remove items
- Stack splitting
- Weight tracking

## Cross-references

- [[item-generator]] - Items
- [[loot-generator]] - Loot