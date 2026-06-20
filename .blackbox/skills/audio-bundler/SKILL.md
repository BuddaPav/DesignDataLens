---
name: audio-bundler
description: Bundle audio assets for deployment. Use when packaging audio.
---

# Audio Bundler

## When to use this skill

- Audio bundling
- Format conversion
- Compression optimization

## Bundler Structure

```typescript
interface AudioBundle {
  id: string
  files: AudioFile[]
  format: AudioFormat
  quality: number
}
```

## Operations

- Bundle audio files
- Convert formats
- Optimize size

## Cross-references

- [[asset-bundler]] - Assets
- [[sound-designer]] - Sound
- [[audio-loader]] - Loader