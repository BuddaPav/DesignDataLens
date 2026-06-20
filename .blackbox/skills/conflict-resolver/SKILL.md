---
name: conflict-resolver
description: Resolve data synchronization conflicts. Use when handling save conflicts.
---

# Conflict Resolver

## When to use this skill

- Conflict detection
- Auto-resolution
- Manual resolution UI

## Conflict Structure

```typescript
interface DataConflict {
  localValue: unknown
  remoteValue: unknown
  resolution: ConflictResolution
}
```

## Operations

- Detect conflict
- Auto-resolve
- Present options

## Cross-references

- [[cloud-sync]] - Sync
- [[save-manager]] - Save