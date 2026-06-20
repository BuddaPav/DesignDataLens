---
name: ambient-audio
description: Manage ambient soundscapes. Use when creating ambient audio.
---

# Ambient Audio

## When to use this skill

- Ambient sound loops
- Environmental audio
- Sound layering

## Ambient Structure

```typescript
interface AmbientSoundscape {
  id: string
  sounds: AmbientSound[]
  masterVolume: number
}
```

## Operations

- Create ambient layer
- Fade between sounds
- Spatial positioning

## Cross-references

- [[sound-designer]] - Sound
- [[spatial-audio]] - Spatial
- [[weather-system]] - Weather