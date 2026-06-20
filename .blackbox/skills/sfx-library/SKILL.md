---
name: sfx-library
description: Manage sound effects library. Use when organizing SFX collections.
---

# SFX Library

## When to use this skill

- SFX organization
- Category management
- Search and retrieval

## Library Structure

```typescript
interface SFXLibrary {
  categories: Map<string, SoundEffect[]>
  tags: Map<string, string[]>
}
```

## Operations

- Categorize sounds
- Tag effects
- Search library

## Cross-references

- [[sound-designer]] - Sound
- [[audio-bundler]] - Bundler