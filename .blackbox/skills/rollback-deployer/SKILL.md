---
name: rollback-deployer
description: Rollback deployments to previous version. Use when reverting bad deploys.
---

# Rollback Deployer

## When to use this skill

- Deployment rollback
- Version revert
- Quick recovery

## Rollback Structure

```typescript
interface DeployRollback {
  currentVersion: string
  targetVersion: string
  deployTime: number
}
```

## Operations

- Identify rollback
- Restore previous
- Verify health

## Cross-references

- [[deploy-automator]] - Deploy
- [[rollback-manager]] - Rollback