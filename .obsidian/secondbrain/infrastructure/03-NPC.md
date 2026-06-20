---
tags: [knowledge, npc]
type: npc-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# NPC Encyclopedia

## NPC Architecture

### Base Stats

- HP: 10-1000 (level scaled)
- Attack: 1-100
- Defense: 0-80
- Speed: 1-10

### AI Behavior Trees

```
Root
+-- Idle
¦   L-- Wander / Work / Pray
+-- Combat
¦   +-- Attack / Flee / Call Help
+-- Social
¦   +-- Greet / Trade / Quest / Romance
L-- Memory
    L-- Remember / Forget / Share
```

### Personality Model (Big Five)


| Trait | Range | Effect |
|-------|-------|--------|
| Openness | 0-1 | Curiosity, creativity |
| Conscientiousness | 0-1 | Reliability, discipline |
| Extraversion | 0-1 | Social energy |
| Agreeableness | 0-1 | Cooperation |
| Neuroticism | 0-1 | Emotional stability |

## NPC Schedules

- Work hours: configurable per NPC
- Sleep: 22:00-06:00 default
- Meals: 08:00, 12:00, 18:00
- Social: 19:00-22:00

## Dialogue System

- Greeting variations: 5+
- Quest offer patterns: 10+
- Combat taunts: 5+
- Romance flags: tracked separately


## Memory Types


- Short-term: Last 10 actions
- Medium-term: Key session events
- Long-term: Important player choices
- Episodic: Full story log
