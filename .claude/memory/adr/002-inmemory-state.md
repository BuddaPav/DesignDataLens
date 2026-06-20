# ADR 002: In-Memory State Design

## Status: Accepted

## Context
Границы - игра требует быстрого доступа к состоянию
Требования: sub-100ms для NPC AI decisions

## Decision
In-memory state с periodic persistence

## Reasoning
### За
- Sub-100ms latencies для AI decisions
- No DB round-trip для NPC cognition
- Проще development

### Против
- Data loss при crash
- Limited history

## Implementation
```
State = {
  npcs: Map<id, NPC>
  world: WorldState
  players: Map<id, Player>
  time: GameTime
}
```

## Persistence Strategy
- Auto-save каждые 60 секунд
- Debounced writes (batch)
- On-demand save (кнопка)

## Migration Plan
- Phase 1: In-memory (current)
- Phase 2: Redis cache layer
- Phase 3: Full SQL (analytics)

## Related
- ADR 001: MongoDB choice
- ADR 006: NPC memory embeddings