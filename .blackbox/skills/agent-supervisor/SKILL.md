---
name: agent-supervisor
description: Monitor and supervise agent work. Use when checking agent progress and quality.
---

# Agent Supervisor

## When to use this skill

- Monitoring agent progress
- Quality control
- Progress tracking
- Error detection

## Supervision Metrics

| Metric | Tool | Check Frequency |
|--------|------|----------------|
| Code quality | ESLint | Every task |
| Test pass rate | npm test | Every task |
| Type safety | TypeScript | Real-time |
| Circular deps | madge | Daily |

## Quality Gates

- **Linting**: No errors
- **Tests**: 60%+ coverage
- **Types**: Strict mode
- **Circular**: 0 deps

## Cross-references

- [[meta-agent-coordinator]] - Agent coordination
- [[jwilgeragent-skills]] - Workflow