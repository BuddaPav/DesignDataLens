---
name: version-bumper
description: Automate version number updates. Use when incrementing versions.
---

# Version Bumper

## When to use this skill

- Semantic versioning
- Version increment
- Version tags

## Version Structure

```typescript
interface Version {
  major: number
  minor: number
  patch: number
  prerelease?: string
}
```

## Operations

- Parse version
- Increment version
- Generate tag

## Cross-references

- [[release-manager]] - Release
- [[changelog-generator]] - Changelog