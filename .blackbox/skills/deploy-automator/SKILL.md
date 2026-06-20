---
name: deploy-automator
description: Automate deployment processes. Use when deploying to servers.
---

# Deploy Automator

## When to use this skill

- Deployment automation
- Server provisioning
- Health checks

## Deploy Structure

```typescript
interface DeployConfig {
  environment: string
  servers: Server[]
  preDeploy: Task[]
  postDeploy: Task[]
}
```

## Operations

- Execute deploy
- Run health check
- Rollback on failure

## Cross-references

- [[build-automator]] - Build
- [[rollback-deployer]] - Rollback