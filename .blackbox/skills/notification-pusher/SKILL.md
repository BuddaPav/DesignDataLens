---
name: notification-pusher
description: Push notifications to users. Use when sending push notifications.
---

# Notification Pusher

## When to use this skill

- Push notifications
- Scheduled messaging
- Targeting

## Push Structure

```typescript
interface PushNotification {
  id: string
  title: string
  body: string
  targeting: TargetingRule[]
}
```

## Operations

- Send push
- Schedule notification
- Track delivery

## Cross-references

- [[notification-manager]] - In-game
- [[discord-bot]] - Discord