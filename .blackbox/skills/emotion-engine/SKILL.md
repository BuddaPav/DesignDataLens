---
name: emotion-engine
description: Manage NPC emotions and mood changes. Use when tracking NPC emotional state.
---

# Emotion Engine

## When to use this skill

- NPC mood tracking
- Emotion transitions
- Behavioral influence

## Emotion States

| State | Trigger |
|-------|----------|
| neutral | Default |
| excited | Positive event |
| frustrated | Blocking |
| curious | New info |
| bored | Repetition |
| stressed | Danger |
| relaxed | Safe |

## Transition Rules

```typescript
const transition = (current: Emotion, event: Event): Emotion => {
  if (event.type === 'positive') return 'excited'
  if (event.type === 'negative') return 'frustrated'
  return current
}
```

## Cross-references

- [[personality-model]] - Personality
- [[ai-behaviour-tree]] - Behaviour