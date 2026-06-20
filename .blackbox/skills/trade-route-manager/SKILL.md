---
name: trade-route-manager
description: Manage trade routes between locations. Use when configuring caravan paths.
---

# Trade Route Manager

## When to use this skill

- Route configuration
- Pathfinding
- Trade logistics

## Existing Routes

- willbrook_ring
- ruins_forest_shuttle
- crossroads_loop
- village_ruins_spine
- misty_ruins_triangle
- delta_marsh_run
- ashen_ridge_line
- frontier_chain

## Route Structure

```typescript
interface TradeRoute {
  id: string
  name: string
  stops: Location[]
  duration: number
  profit: number
}
```

## Cross-references

- [[caravan-simulator]] - Caravan simulation
- [[price-calculator]] - Pricing