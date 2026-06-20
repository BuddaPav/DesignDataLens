---
name: feature-flag-manager
description: Manage feature flags for A/B testing. Use when controlling feature rollout.
---

# Feature Flag Manager

## When to use this skill

- Feature toggles
- Remote config
- Gradual rollout

## Flag Structure

```typescript
interface FeatureFlag {
  id: string
  enabled: boolean
  rollout: number
  segment: string[]
}
```

## Operations

- Create flag
- Toggle feature
- Track usage

## Cross-references

- [[ab-test-manager]] - A/B
- [[canary-deployer]] - Canary