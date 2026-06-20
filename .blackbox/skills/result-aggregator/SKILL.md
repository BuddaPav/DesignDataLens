---
name: result-aggregator
description: Aggregate results from multiple agents. Use when combining subagent outputs.
---

# Result Aggregator

## When to use this skill

- Combining agent outputs
- Merging code changes
- Unifying results
- Conflict resolution

## Aggregation Patterns

### Sequential Results
```typescript
// Combine in order
const results = await agents.map(runAgent)
return mergeSequentially(results)
```

### Parallel Results
```typescript
// Combine in parallel
const results = await Promise.all(subtasks)
return mergeAll(results)
```

## Cross-references

- [[meta-agent-coordinator]] - Coordination
- [[conflict-resolver]] - Conflict resolution