---
name: kill-switch-agent
description: Emergency stop for misbehaving agents. Use when agents run amok.
---

# Kill Switch Agent

## When to use this skill

- Stopping runaway agents
- Emergency stops
- Resource cleanup

## Emergency Actions

| Trigger | Action |
|---------|--------|
| Infinite loop | Terminate |
| Memory explosion | Stop & cleanup |
| Timeout | Force stop |

## Safety Mechanisms

- Max runtime limits
- Memory caps
- Output limits

## Cross-references

- [[error-handler-agent]] - Error handling
- [[agent-health-monitor]] - Health monitoring