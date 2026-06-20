---
name: refactor-assistant
description: Refactor duplicate code and improve code quality. Use when identifying refactoring opportunities.
---

# Refactor Assistant

## When to use this skill

- Finding duplicate code
- Extracting common logic
- Breaking large files
- Improving code quality

## Large Files (>1000 lines)

| File | Lines | Target |
|------|-------|--------|
| useGameState.ts | 1897 | ~800 |
| WorldScene3D.tsx | 1703 | ~1000 |
| GameScreen.tsx | 1064 | ~600 |
| NPCSystem.ts | 968 | ~700 |

## Refactoring Patterns

### Extract Sub-hooks

```typescript
// Before: one large hook
const useGameState = () => {
  // 1897 lines
}

// After: split into sub-hooks
const useTimeAdvance = () => { /* time logic */ }
const useNPCs = () => { /* NPC logic */ }
const useWorld = () => { /* world logic */ }
const useTrade = () => { /* trade logic */ }
```

### Extract Constants

```typescript
// Bad: magic numbers
if (distance < 50) { }

// Good: named constants
const INTERACTION_DISTANCE = 50
if (distance < INTERACTION_DISTANCE) { }
```

## Cross-references

- [[code-scaffold]] - Component scaffolding
- [[dependency-analyzer]] - Dependency analysis