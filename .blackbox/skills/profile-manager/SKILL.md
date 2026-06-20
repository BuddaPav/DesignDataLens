---
name: profile-manager
description: Manage player profiles and accounts. Use when handling player accounts.
---

# Profile Manager

## When to use this skill

- Profile creation
- Profile switching
- Profile data storage

## Profile Structure

```typescript
interface PlayerProfile {
  id: string
  name: string
  settings: ProfileSettings
  achievements: Achievement[]
}
```

## Operations

- Create profile
- Load profile
- Update profile

## Cross-references

- [[save-manager]] - Save
- [[cloud-storage]] - Storage