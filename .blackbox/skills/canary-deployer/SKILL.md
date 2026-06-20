---
name: canary-deployer
description: Deploy to canary group first. Use when testing new releases.
---

# Canary Deployer

## When to use this skill

- Canary deployment
- Gradual rollout
- A/B testing

## Canary Structure

```typescript
interface CanaryConfig {
  percentage: number
  targetGroup: string
  metrics: Metric[]
}
```

## Operations

- Route traffic
- Monitor metrics
- Promote or rollback

## Cross-references

- [[deploy-automator]] - Deploy
- [[ab-test-manager]] - A/B