---
name: minimap-overlay
description: Create minimap overlay for world navigation. Use when building minimap HUD.
---

# Minimap Overlay

## When to use this skill

- Minimap rendering
- Player position marker
- Map coordinate display

## Minimap Structure

```typescript
interface MinimapConfig {
  size: number
  zoom: number
  showPOIs: boolean
  playerHeading: number
}
```

## Operations

- Render minimap canvas
- Update player marker
- Draw POI icons

## Cross-references

- [[mini-map-generator]] - Generator
- [[hud-builder]] - HUD
- [[world-generator]] - World