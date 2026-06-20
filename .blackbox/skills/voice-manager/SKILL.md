---
name: voice-manager
description: Manage voice acting and dialogue audio. Use when handling NPC voice audio.
---

# Voice Manager

## When to use this skill

- Voice track management
- Lip-sync coordination
- Voice volume control

## Voice Structure

```typescript
interface VoiceClip {
  id: string
  npcId: string
  text: string
  audioUrl: string
  duration: number
}
```

## Operations

- Load voice clips
- Trigger dialogue audio
- Handle lip-sync

## Cross-references

- [[dialogue-builder]] - Dialogues
- [[sound-designer]] - Sound
- [[spatial-audio]] - Spatial