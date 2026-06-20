---
name: cross-device-sync
description: Sync game data across multiple devices. Use when enabling cross-device play.
---

# Cross-Device Sync

## When to use this skill

- Device pairing
- Data synchronization
- Session transfer

## CrossDevice Structure

```typescript
interface DeviceSyncState {
  pairedDevices: string[]
  currentDevice: string
  syncEnabled: boolean
}
```

## Operations

- Pair devices
- Transfer session
- Handle disconnect

## Cross-references

- [[cloud-sync]] - Sync
- [[profile-manager]] - Profile