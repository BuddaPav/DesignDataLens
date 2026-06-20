---
name: ab-test-manager
description: Manage A/B testing experiments. Use when running experiments.
---

# A/B Test Manager

## When to use this skill

- Test configuration
- Variant management
- Result analysis

## A/B Structure

```typescript
interface ABTest {
  id: string
  variants: Variant[]
  trafficSplit: number[]
  metric: string
}
```

## Operations

- Create test
- Assign variant
- Track conversion

## Cross-references

- [[feature-flag-manager]] - Flags
- [[analytics-integration]] - Analytics