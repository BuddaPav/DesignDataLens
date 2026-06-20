---
name: music-mixer
description: Mix and balance background music tracks. Use when managing game music.
---

# Music Mixer

## When to use this skill

- Music track mixing
- Volume balancing
- Track transitions

## Music Structure

```typescript
interface MusicTrack {
  id: string
  name: string
  bpm: number
  key: string
  layers: AudioLayer[]
}
```

## Operations

- Mix music layers
- Handle transitions
- Balance volumes

## Cross-references

- [[sound-designer]] - Sound
- [[ambient-audio]] - Ambient
- [[volume-balancer]] - Volume