---
name: changelog-generator
description: Generate changelogs from git history. Use when creating release notes.
---

# Changelog Generator

## When to use this skill

- Changelog generation
- Commit categorization
- Release notes creation

## Changelog Structure

```typescript
interface ChangelogEntry {
  version: string
  date: string
  changes: Change[]
  breaking: boolean
}
```

## Operations

- Parse commits
- Categorize changes
- Generate markdown

## Cross-references

- [[release-manager]] - Release
- [[version-bumper]] - Version