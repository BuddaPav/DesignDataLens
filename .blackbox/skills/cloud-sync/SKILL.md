---
name: cloud-sync
description: Sync game data with cloud storage. Use when enabling cloud saves.
---

# Cloud Sync

## When to use this skill

- Cloud synchronization
- Upload/downsync
- Conflict handling

## Sync Structure

```typescript
interface CloudSyncState {
  lastSynced: number
  pendingChanges: Change[]
  conflicts: Conflict[]
}
```

## Operations

- Push to cloud
- Pull from cloud
- Resolve conflicts

## Cross-references

- [[save-manager]] - Save
- [[cloud-storage]] - Storage
- [[cross-device-sync]] - Cross-device