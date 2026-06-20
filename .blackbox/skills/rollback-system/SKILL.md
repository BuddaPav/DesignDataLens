---
name: rollback-system
description: Rollback game state to previous version. Use when reverting changes.
---

# Rollback System

## When to use this skill

- State rollback
- Version reversion
- Restore checkpoint

## Rollback Structure

```typescript
interface RollbackPoint {
  id: string
  timestamp: number
  state: GameState
}
```

## Operations

- Create checkpoint
- Restore to point
- List rollbacks

## Cross-references

- [[save-manager]] - Save
- [[backup-manager]] - Backup