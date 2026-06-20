---
name: hud-builder
description: Build heads-up display elements. Use when creating HUD components.
---

# HUD Builder

## When to use this skill

- HUD element construction
- Status display bars
- Overlay positioning

## HUD Structure

```typescript
interface HUDElement {
  id: string
  type: 'bar' | 'icon' | 'text' | 'meter'
  position: HUDPosition
  value: number
}
```

## Operations

- Create HUD element
- Update value display
- Position on screen

## Cross-references

- [[panel-constructor]] - Panels
- [[minimap-overlay]] - Minimap
- [[notification-manager]] - Notifications