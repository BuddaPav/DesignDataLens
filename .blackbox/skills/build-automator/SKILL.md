---
name: build-automator
description: Automate build pipelines. Use when setting up CI/CD.
---

# Build Automator

## When to use this skill

- Build automation
- Pipeline setup
- Artifact generation

## Build Structure

```typescript
interface BuildPipeline {
  stages: BuildStage[]
  triggers: Trigger[]
}
```

## Operations

- Execute pipeline
- Generate artifacts
- Run tests

## Cross-references

- [[release-manager]] - Release
- [[artifact-manager]] - Artifacts