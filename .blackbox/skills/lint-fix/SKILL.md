---
name: lint-fix
description: Automatically fix ESLint errors. Use when fixing code quality issues.
---

# Lint Fix

## When to use this skill

- Fixing ESLint errors
- Code quality fixes
- Auto-formatting

## Commands

```bash
# Fix all lint issues
npm run lint

# Fix specific file
npx eslint --fix src/file.ts
```

## Common Fixes

| Rule | Fix |
|------|-----|
| unused-vars | Remove variable |
| import-order | Auto-sort |
| naming convention | Rename |

## Cross-references

- [[agent-supervisor]] - Quality control