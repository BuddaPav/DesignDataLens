---
name: caravan-simulator
description: Simulate trade caravans traveling between locations. Use when managing trade logistics.
---

# Caravan Simulator

## When to use this skill

- Caravan movement
- Trade timing
- Arrival prediction

## Caravan Structure

```typescript
interface Caravan {
  id: string
  route: string
  position: number
  cargo: Item[]
  value: number
  arrivalTime: number
}
```

## Simulation Logic

- Position updates per tick
- Arrival events
- Price impacts

## Cross-references

- [[trade-route-manager]] - Routes
- [[market-analytics]] - Analytics