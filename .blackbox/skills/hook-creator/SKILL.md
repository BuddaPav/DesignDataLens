---
name: hook-creator
description: Create React hooks with proper API design. Use when extracting logic into reusable hooks.
---

# Hook Creator

## When to use this skill

- Extracting logic from components
- Creating reusable state logic
- Adding new game features
- Managing complex state

## Basic Hook Pattern

```typescript
import { useState, useCallback, useEffect } from 'react'

export const useHookName = (initialValue?: Type) => {
  const [state, setState] = useState<Type>(initialValue)

  const action = useCallback((params) => {
    setState((prev) => newValue)
  }, [dependencies])

  return { state, action }
}
```

## Game State Hooks (useGameState pattern)

```typescript
// Main game state hook (1897 lines - needs refactor)
const { gameState, dispatch } = useGameState()

// Dispatch types
type GameDispatch =
  | { type: 'ADVANCE_TIME'; payload: number }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'ADD_NPC'; payload: NPC }
  | { type: 'UPDATE_NPC'; payload: { id: string; updates: Partial<NPC> } }
  | { type: 'APPLY_CONSEQUENCE'; payload: Consequence }
```

## Common Hook Patterns

| Pattern | Use Case |
|---------|---------|
| useState | Simple local state |
| useReducer | Complex state logic |
| useEffect | Side effects |
| useCallback | Event handlers |
| useMemo | Expensive computations |
| useRef | Mutable refs |

## Cross-references

- [[code-scaffold]] - Component scaffolding
- [[type-generator]] - Type generation
- [[test-generator]] - Test generation