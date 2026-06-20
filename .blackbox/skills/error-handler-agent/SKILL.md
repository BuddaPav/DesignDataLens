---
name: error-handler-agent
description: Handle agent errors and recovery. Use when agents fail.
---

# Error Handler Agent

## When to use this skill

- Error recovery
- Retry logic
- Fallback execution

## Error Types

| Type | Action |
|------|--------|
| Timeout | Retry with backoff |
| Auth | Re-authenticate |
| Rate limit | Wait and retry |
| Fatal | Log and skip |

## Recovery Patterns

```typescript
const executeWithRetry = async (task, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await runAgent(task)
    } catch (error) {
      if (isFatal(error)) throw error
      await sleep(1000 * Math.pow(2, i))
    }
  }
}
```

## Cross-references

- [[agent-health-monitor]] - Health monitoring
- [[progress-tracker]] - Progress tracking