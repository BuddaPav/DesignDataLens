---
name: crash-reporter
description: Report and track game crashes. Use when handling crash reports.
---

# Crash Reporter

## When to use this skill

- Crash detection
- Report generation
- Stack trace collection

## Crash Structure

```typescript
interface CrashReport {
  id: string
  stack: string
  deviceInfo: DeviceInfo
  timestamp: number
}
```

## Operations

- Detect crash
- Collect context
- Submit report

## Cross-references

- [[telemetry-collector]] - Telemetry