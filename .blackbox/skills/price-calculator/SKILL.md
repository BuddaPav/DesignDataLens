---
name: price-calculator
description: Calculate dynamic item prices. Use when setting merchant prices.
---

# Price Calculator

## When to use this skill

- Dynamic pricing
- Supply/demand
- Merchant offers

## Price Formula

```typescript
const calculate = (base: number, demand: number, supply: number): number => {
  const ratio = demand / supply
  return base * (0.5 + ratio * 0.5)
}
```

## Factors

- Base value
- Merchant type
- Player reputation
- Supply/demand

## Cross-references

- [[economy-balancer]] - Balance
- [[trade-route-manager]] - Trade routes