---
name: inventory-ui
description: Build player inventory UI. Use when displaying inventory interface.
---

# Inventory UI

## When to use this skill

- Inventory display
- Item slot management
- Item selection

## Inventory UI Structure

```typescript
interface InventoryUIState {
  selectedSlot: number | null
  dragItem: Item | null
  filter: ItemFilter
}
```

## Operations

- Render inventory grid
- Handle item click/drag
- Apply filters

## Cross-references

- [[inventory-manager]] - Inventory
- [[item-generator]] - Items
- [[tooltip-generator]] - Tooltips