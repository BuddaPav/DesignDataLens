---
name: menu-builder
description: Build game menus and navigation. Use when creating game menus.
---

# Menu Builder

## When to use this skill

- Building game menus
- Navigation structure
- Menu item handling

## Menu Structure

```typescript
interface MenuItem {
  id: string
  label: string
  icon?: string
  action: () => void
  children?: MenuItem[]
}
```

## Operations

- Create menu hierarchy
- Handle menu selection
- Apply keyboard shortcuts

## Cross-references

- [[panel-constructor]] - Panels
- [[dialog-system]] - Dialogs
- [[hud-builder]] - HUD