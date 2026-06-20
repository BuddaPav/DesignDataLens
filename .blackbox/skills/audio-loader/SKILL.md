---
name: audio-loader
description: Lazy load audio assets on demand. Use when optimizing audio loading.
---

# Audio Loader

## When to use this skill

- Lazy audio loading
- Audio caching
- Preload management

## Loader Structure

```typescript
interface AudioLoaderState {
  loaded: Set<string>
  loading: Set<string>
  cache: Map<string, AudioBuffer>
}
```

## Operations

- Load on demand
- Cache audio buffers
- Handle unload

## Cross-references

- [[audio-bundler]] - Bundler
- [[sound-designer]] - Sound