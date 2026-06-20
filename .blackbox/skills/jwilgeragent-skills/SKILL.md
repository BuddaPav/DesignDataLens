---
name: jwilgeragent-skills
description: Agent workflow and development guidance for Chronos project. Use when orchestrating complex tasks, managing multi-step development, or coordinating development sessions.
---

# Jwilgeragent Workflow Skills

## When to use this skill

- Complex multi-step tasks
- Managing development sessions
- Coordinating feature development
- Running orchestrate gates

## Development Workflow

### Quick Start
```bash
cd app
npm run orchestrate:gate   # lint + test + circular check
```

### Full QA
```bash
npm run ci   # orchestrate + typecheck
```

### Daily Workflow
```bash
# Morning
npm run obsidian:pull

# Work...

# Evening
npm run obsidian:push
```

## Agent Context

### Start of Session
1. Load Obsidian context: `Agent Memory.md`
2. Check `Progress Log.md`
3. Review `Bugs.md`

### End of Session
1. Update `Progress Log.md`
2. Update `Agent Memory.md`
3. Push to Obsidian

## Development Patterns

### Feature Development
```bash
# 1. Analyze existing code
# 2. Add tests first
# 3. Implement feature
# 4. Update docs

# Example:
npm run test:watch   # TDD mode
```

### Bug Fixing
```bash
# 1. Find bug in code
# 2. Write failing test
# 3. Fix code
# 4. Verify test passes
# 5. Update Bugs.md
```

## Orchestrate Commands

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run deps:circular` | Circular deps check |
| `npm run orchestrate:gate` | Full gate (lint+test+circular) |

## Cross-references

- [[supermemory]] - Memory context
- [[everyinccompound-engineering]] - Feature compounding
- [[context-continuity-guardian]] - Context preservation