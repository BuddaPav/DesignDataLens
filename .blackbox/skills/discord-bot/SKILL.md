---
name: discord-bot
description: Manage Discord bot for community. Use when creating Discord integration.
---

# Discord Bot

## When to use this skill

- Discord commands
- Channel management
- Webhook handling

## Discord Structure

```typescript
interface DiscordBot {
  token: string
  guilds: string[]
  channels: string[]
}
```

## Operations

- Handle commands
- Send messages
- Manage roles

## Cross-references

- [[notification-pusher]] - Notifications
- [[social-share]] - Social