---
name: analytics-integration
description: Integrate analytics services. Use when tracking player behavior.
---

# Analytics Integration

## When to use this skill

- Event tracking
- User journey
- Funnel analysis

## Analytics Structure

```typescript
interface AnalyticsEvent {
  name: string
  properties: Record<string, unknown>
  timestamp: number
}
```

## Operations

- Track event
- Build funnel
- Generate report

## Cross-references

- [[telemetry-collector]] - Telemetry
- [[ab-test-manager]] - A/B