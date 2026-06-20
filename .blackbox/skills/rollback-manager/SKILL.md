---
name: rollback-manager
description: Manage version rollbacks. Use when handling rollback strategy.
---

# Rollback Manager

## When to use this skill

- Rollback strategy
- Version history
- Recovery planning

## RollbackManager Structure

```typescript
interface RollbackStrategy {
  maxRollbackCount: number
  autoRollback: boolean
  healthThreshold: number
}
```

## Operations

- Track versions
- Execute rollback
- Verify integrity

## Cross-references

- [[rollback-deployer]] - Deploy rollback
- [[backup-manager]] - Backup