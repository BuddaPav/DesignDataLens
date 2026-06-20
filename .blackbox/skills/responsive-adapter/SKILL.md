---
name: responsive-adapter
description: Adapt UI to different screen sizes. Use when handling responsive layouts.
---

# Responsive Adapter

## When to use this skill

- Screen size detection
- Layout adaptation
- Breakpoint handling

## Responsive Structure

```typescript
interface ResponsiveConfig {
  breakpoints: Breakpoint[]
  current: Breakpoint
  orientation: 'portrait' | 'landscape'
}
```

## Operations

- Detect screen size
- Switch layout mode
- Handle resize events

## Cross-references

- [[accessibility-checker]] - Accessibility
- [[hud-builder]] - HUD