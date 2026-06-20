---
name: spatial-audio
description: Implement 3D spatial audio positioning. Use when creating positional audio.
---

# Spatial Audio

## When to use this skill

- 3D audio positioning
- Distance attenuation
- Panning controls

## Spatial Structure

```typescript
interface SpatialSource {
  id: string
  position: Vector3
  audioUrl: string
  rolloff: number
}
```

## Operations

- Position audio in 3D
- Apply distance model
- Handle orientation

## Cross-references

- [[ambient-audio]] - Ambient
- [[voice-manager]] - Voice
- [[world-generator]] - World