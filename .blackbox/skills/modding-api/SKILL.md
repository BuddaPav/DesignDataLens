---
name: modding-api
description: API for community modding support. Use when enabling mods.
---

# Modding API

## When to use this skill

- Mod loading
- Extension points
- Custom content

## API Structure

```typescript
interface ModAPI {
  hooks: ModHook[]
  data: ModData
  permissions: string[]
}
```

## Operations

- Load mod
- Execute hook
- Validate mod

## Cross-references

- [[feature-flag-manager]] - Flags