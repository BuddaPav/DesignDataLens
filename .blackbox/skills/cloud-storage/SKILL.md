---
name: cloud-storage
description: Manage cloud storage operations. Use when accessing cloud storage.
---

# Cloud Storage

## When to use this skill

- Cloud read/write
- Storage quotas
- File management

## Storage Structure

```typescript
interface CloudStorage {
  used: number
  quota: number
  files: CloudFile[]
}
```

## Operations

- Upload file
- Download file
- Delete file

## Cross-references

- [[cloud-sync]] - Sync
- [[cdn-manager]] - CDN