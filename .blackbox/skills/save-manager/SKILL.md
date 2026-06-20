---
name: save-manager
description: Manage game save and load operations. Use when handling save/load.
---

# Save Manager

## When to use this skill

- Save game state
- Load saved data
- Save slot management

## Save Structure

```typescript
interface SaveSlot {
  id: string
  timestamp: number
  checksum: string
  data: GameState
}
```

## Operations

- Save to slot
- Load from slot
- Validate checksum

## Cross-references

- [[cloud-sync]] - Sync
- [[profile-manager]] - Profile
- [[rollback-system]] - Rollback