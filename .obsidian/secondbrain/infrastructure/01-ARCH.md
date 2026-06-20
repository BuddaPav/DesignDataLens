---
tags: [knowledge, architecture]
type: knowledge-base
created: 2026-06-20
updated: 2026-06-20
---
# Architecture Knowledge Base

## Module Dependencies

### Core Engine

- `src/engine/` > `src/domain/` > `src/lib/`
- `src/entities/` > `src/domain/` > `src/types/`
- `src/world/` > `src/entities/` > `src/rendering/`

### Rendering Pipeline

- `rendering/` depends on `engine/`
- `world/` renders through `rendering/`
- UI flows through `domain/` state

### Data Flow

```
User Input > Engine > Domain > World > Entities > Rendering
     v                              v
   State <<<<<<<<<<<<<<<<<
```

## Performance Budgets

| Component | Budget |
|-----------|--------|
| World tick | 100ms |
| Render frame | 16ms (60fps) |
| NPC update | 10ms per NPC |
| Dialogue | 200ms |
| Save game | 500ms |

## Memory Management

- Max active NPCs: 20
- NPC awareness radius: 3 tiles
- Dialogue cache: 3 concurrent
- Quest tracking: 5 active in HUD
