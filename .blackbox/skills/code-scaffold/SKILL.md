---
name: code-scaffold
description: Generate component/hook scaffolding from specifications. Use when starting new features or creating boilerplate code.
---

# Code Scaffold

## When to use this skill

- Starting new components
- Creating new hooks
- Setting up new engine modules
- Generating boilerplate for features

## Project Structure

```
app/src/
├── components/
│   └── screens/           # Screen components
├── hooks/               # Custom React hooks
├── engine/              # Game engine modules
├── domain/             # Domain logic
└── types/              # TypeScript types
```

## Component Template

```typescript
import React from 'react'
import type { FC } from 'react'

interface ComponentNameProps {
  // Props interface
}

export const ComponentName: FC<ComponentNameProps> = ({
  // Destructure props
}) => {
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Hook Template

```typescript
import { useState, useCallback } from 'react'

export const useFeatureName = () => {
  const [state, setState] = useState(initialValue)

  const action = useCallback((params) => {
    // Logic
  }, [])

  return { state, action }
}
```

## Engine Module Template

```typescript
import type { GameState } from '../types/game'

export const createModule = (gameState: GameState) => {
  const update = (delta: number) => {
    // Update logic
  }

  return { update }
}
```

## Cross-references

- [[type-generator]] - Type generation
- [[hook-creator]] - Hook creation
- [[test-generator]] - Test generation