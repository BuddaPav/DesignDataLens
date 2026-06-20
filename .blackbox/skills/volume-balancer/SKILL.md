---
name: volume-balancer
description: Balance audio volume levels across game. Use when normalizing audio.
---

# Volume Balancer

## When to use this skill

- Volume normalization
- Dynamic range control
- Master volume handling

## Volume Structure

```typescript
interface VolumeSettings {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
}
```

## Operations

- Normalize volumes
- Apply ducking
- Handle mute states

## Cross-references

- [[music-mixer]] - Music
- [[sfx-library]] - SFX
- [[ambient-audio]] - Ambient