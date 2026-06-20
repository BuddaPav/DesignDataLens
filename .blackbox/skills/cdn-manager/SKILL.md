---
name: cdn-manager
description: Manage CDN for asset delivery. Use when setting up CDN.
---

# CDN Manager

## When to use this skill

- CDN configuration
- Cache invalidation
- Edge location management

## CDN Structure

```typescript
interface CDNConfig {
  provider: string
  zones: CDNZone[]
  cacheRules: CacheRule[]
}
```

## Operations

- Configure CDN
- Invalidate cache
- Monitor delivery

## Cross-references

- [[artifact-manager]] - Artifacts
- [[deploy-automator]] - Deploy