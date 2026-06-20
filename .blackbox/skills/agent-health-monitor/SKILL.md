---
name: agent-health-monitor
description: Monitor agent health and status. Use when checking agent availability.
---

# Agent Health Monitor

## When to use this skill

- Checking agent status
- Health diagnostics
- Resource monitoring

## Health Metrics

| Metric | Healthy | Warning |
|--------|---------|---------|
| Tasks/hour | 5+ | 1-5 |
| Error rate | <5% | 5-20% |
| Response time | <5s | 5-30s |

## Monitoring Tools

- Task output
- Error logs
- Resource usage

## Cross-references

- [[agent-supervisor]] - Supervision
- [[error-handler-agent]] - Error handling