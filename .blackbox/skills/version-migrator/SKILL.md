---
name: version-migrator
description: Migrate save data between versions. Use when handling game updates.
---

# Version Migrator

## When to use this skill

- Save migration
- Schema updates
- Data transformation

## Migration Structure

```typescript
interface Migration {
  fromVersion: string
  toVersion: string
  transform: (data: unknown) => unknown
}
```

## Operations

- Detect version
- Apply migrations
- Validate result

## Cross-references

- [[save-manager]] - Save
- [[rollback-system]] - Rollback