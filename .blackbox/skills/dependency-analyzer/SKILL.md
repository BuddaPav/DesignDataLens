---
name: dependency-analyzer
description: Analyze dependencies and detect circular references. Use when checking architecture.
---

# Dependency Analyzer

## When to use this skill

- Finding circular deps
- Mapping dependencies
- Architecture validation

## Check Commands

```bash
# Check circular dependencies
npm run deps:circular

# Find imports
grep -r "from '../engine'" app/src/
```

## Current Status

- Circular deps: **0** ✓
- Uses: madge

## Cross-references

- [[refactor-assistant]] - Refactoring
- [[schema-validator]] - Schema validation