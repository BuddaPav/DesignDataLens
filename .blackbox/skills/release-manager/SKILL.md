---
name: release-manager
description: Manage game releases and versioning. Use when releasing game builds.
---

# Release Manager

## When to use this skill

- Release orchestration
- Version management
- Release notes

## Release Structure

```typescript
interface Release {
  version: string
  channels: ReleaseChannel[]
  artifacts: Artifact[]
}
```

## Operations

- Create release
- Tag version
- Publish artifacts

## Cross-references

- [[build-automator]] - Build
- [[version-bumper]] - Version
- [[changelog-generator]] - Changelog