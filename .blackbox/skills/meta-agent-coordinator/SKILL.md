---
name: meta-agent-coordinator
description: Coordinate multiple agents working on subtasks. Use when delegating work to subagents.
---

# Meta Agent Coordinator

## When to use this skill

- Orchestrating multiple agents
- Breaking large tasks into subtasks
- Aggregating results
- Managing parallel work

## Agent Types

| Type | Purpose |
|------|---------|
| Explore | Search and research |
| Plan | Design implementation |
| General | Execute tasks |

## Workflow Pattern

```typescript
// 1. Decompose task into subtasks
const subtasks = [
  { description: 'Research X', agent: 'Explore' },
  { description: 'Implement Y', agent: 'General' },
]

// 2. Execute in parallel or sequence
await Promise.all(subtasks.map(runAgent))

// 3. Aggregate results
const combined = combinesultults(subtasks)
```

## Task Decomposition

| Task Size | Agents Needed |
|----------|-------------|
| Small (1-2h) | 1 agent |
| Medium (4-8h) | 2-3 agents |
| Large (1-3d) | 5-10 agents |

## Cross-references

- [[jwilgeragent-skills]] - Agent workflow
- [[supermemory]] - Context preservation