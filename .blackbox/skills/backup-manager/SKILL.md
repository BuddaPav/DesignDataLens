---
name: backup-manager
description: Manage game data backups. Use when creating backups.
---

# Backup Manager

## When to use this skill

- Backup creation
- Backup scheduling
- Retention management

## Backup Structure

```typescript
interface Backup {
  id: string
  timestamp: number
  size: number
  location: string
}
```

## Operations

- Create backup
- List backups
- Delete old backups

## Cross-references

- [[save-manager]] - Save
- [[cloud-storage]] - Storage