---
name: telemetry-collector
description: Collect game telemetry data. Use when gathering performance data.
---

# Telemetry Collector

## When to use this skill

- Performance telemetry
- Error tracking
- Usage analytics

## Telemetry Structure

```typescript
interface TelemetryData {
  sessionId: string
  events: TelemetryEvent[]
  fps: number
  memory: number
}
```

## Operations

- Collect metrics
- Batch sends
- Filter sensitive

## Cross-references

- [[analytics-integration]] - Analytics
- [[crash-reporter]] - Crash