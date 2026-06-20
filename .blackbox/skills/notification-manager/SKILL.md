---
name: notification-manager
description: Manage in-game notifications and alerts. Use when showing notifications.
---

# Notification Manager

## When to use this skill

- In-game notifications
- Alert management
- Message queue handling

## Notification Structure

```typescript
interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  duration: number
  timestamp: number
}
```

## Operations

- Queue notifications
- Auto-dismiss after duration
- Handle notification click

## Cross-references

- [[tooltip-generator]] - Tooltips
- [[dialog-system]] - Dialogs
- [[hud-builder]] - HUD