---
name: personality-model
description: Model NPC personality and traits. Use when creating NPCs with unique personalities.
---

# Personality Model

## When to use this skill

- Generating NPC personalities
- Trait assignment
- Behavior prediction

## Personality Traits

| Trait | Range | Effect |
|-------|-------|--------|
| openes | 0-100 | Curiosity |
| conscientiousness | 0-100 | Reliability |
| extraversion | 0-100 | Sociability |
| agreeableness | 0-100 | Kindness |
| neuroticism | 0-100 | Emotional stability |

## Template

```typescript
const generatePersonality = (type: NPCType): Personality => {
  const base = getBaseTraits(type)
  return {
    ...base,
    traits: randomize(base, 20),
  }
}
```

## Cross-references

- [[npc-generator]] - NPC generation
- [[emotion-engine]] - Emotions