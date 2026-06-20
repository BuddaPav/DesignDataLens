---
name: vocal-tracker
description: Track and verify voice lines. Use when managing voice recordings.
---

# Vocal Tracker

## When to use this skill

- Voice line tracking
- Recording status
- Missing voice detection

## Vocal Structure

```typescript
interface VocalTrackDatabase {
  npcId: string
  lines: VocalLine[]
  recorded: Set<string>
  missing: Set<string>
}
```

## Operations

- Track recorded lines
- Identify missing content
- Generate report

## Cross-references

- [[voice-manager]] - Voice
- [[dialogue-builder]] - Dialogue