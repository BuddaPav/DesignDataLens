---
name: social-share
description: Share content to social networks. Use when enabling social sharing.
---

# Social Share

## When to use this skill

- Social integration
- Screenshot sharing
- Achievement sharing

## Share Structure

```typescript
interface SocialShareConfig {
  providers: SocialProvider[]
  preCapture: () => void
  metadata: ShareMetadata
}
```

## Operations

- Capture screenshot
- Share to platform
- Track shares

## Cross-references

- [[discord-bot]] - Discord
- [[notification-pusher]] - Push