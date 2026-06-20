---
name: sound-designer
description: Design and create sound effects. Use when creating game audio.
---

# Sound Designer

## When to use this skill

- Sound effect creation
- Audio synthesis
- Sound parameter tuning

## Sound Structure

```typescript
interface SoundEffect {
  id: string
  name: string
  duration: number
  waveform: OscillatorType
  parameters: SoundParams
}
```

## Operations

- Synthesize sounds
- Apply effects
- Export audio

## Cross-references

- [[sfx-library]] - SFX
- [[music-mixer]] - Music
- [[ambient-audio]] - Ambient