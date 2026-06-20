---
name: panel-constructor
description: Construct game UI panels with consistent styling. Use when building game panels.
---

# Panel Constructor

## When to use this skill

- Building game panels
- UI component construction
- Consistent panel styling

## Panel Structure

```typescript
interface PanelConfig {
  id: string
  title: string
  width: number
  height: number
  children: ReactNode
  style?: PanelStyle
}
```

## Operations

- Create panel with header
- Apply tier-based styling
- Handle resize/drag

## Cross-references

- [[hud-builder]] - HUD
- [[menu-builder]] - Menus
- [[notification-manager]] - Notifications