---
name: github-automator
description: Automate GitHub operations. Use when managing repo via API.
---

# GitHub Automator

## When to use this skill

- Issue management
- PR automation
- Repo operations

## GitHub Structure

```typescript
interface GitHubOps {
  owner: string
  repo: string
  token: string
}
```

## Operations

- Create issue
- Manage PR
- Update labels

## Cross-references

- [[build-automator]] - Build