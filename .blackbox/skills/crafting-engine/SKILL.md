---
name: crafting-engine
description: Manage item crafting system. Use when players craft items.
---

# Crafting Engine

## When to use this skill

- Recipe management
- Crafting execution
- Material consumption

## Crafting Structure

```typescript
interface Recipe {
  id: string
  name: string
  inputs: Material[]
  output: Item
  tool?: string
  skill?: string
}
```

## Cross-references

- [[item-generator]] - Items
- [[inventory-manager]] - Inventory