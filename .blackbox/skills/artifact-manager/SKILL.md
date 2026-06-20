---
name: artifact-manager
description: Manage build artifacts. Use when handling release artifacts.
---

# Artifact Manager

## When to use this skill

- Artifact storage
- Version tracking
- Build retention

## Artifact Structure

```typescript
interface BuildArtifact {
  id: string
  version: string
  platform: string
  size: number
  url: string
}
```

## Operations

- Upload artifact
- Download artifact
- Cleanup old builds

## Cross-references

- [[build-automator]] - Build
- [[release-manager]] - Release
- [[cdn-manager]] - CDN