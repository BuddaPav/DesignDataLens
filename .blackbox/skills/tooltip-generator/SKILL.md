---
name: tooltip-generator
description: Generate contextual tooltips for UI elements. Use when creating tooltips.
---

# Tooltip Generator

## When to use this skill

- Generating tooltips
- Context hints
- Information display

## Tooltip Structure

```typescript
interface TooltipConfig {
  target: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}
```

## Operations

- Create tooltip component
- Position tooltip
- Handle hover/focus

## Cross-references

- [[panel-constructor]] - Panels
- [[notification-manager]] - Notifications
- [[inventory-ui]] - Inventory UI