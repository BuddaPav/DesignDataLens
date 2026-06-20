---
name: task-decomposer
description: Decompose large tasks into smaller subtasks. Use when planning implementation.
---

# Task Decomposer

## When to use this skill

- Breaking large features
- Planning implementation
- Estimating effort
- Parallel execution

## Decomposition Guidelines

### By Complexity

| Complexity | Hours | Subtasks |
|------------|-------|---------|
| Small | 1-2 | 1-2 |
| Medium | 4-8 | 3-5 |
| Large | 1-3 days | 5-10 |
| X-Large | 1+ week | 10+ |

### By Layer

- UI components → separate
- Hooks → separate
- Engine → separate
- Domain logic → separate

## Cross-references

- [[meta-agent-coordinator]] - Agent coordination
- [[progress-tracker]] - Progress tracking