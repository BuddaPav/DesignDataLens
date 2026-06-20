---
name: test-generator
description: Generate unit and integration tests. Use when adding test coverage to new features.
---

# Test Generator

## When to use this skill

- Adding unit tests
- Creating integration tests
- Expanding test coverage
- TDD workflow

## Project Testing Setup

- **Framework**: Vitest
- **Coverage**: 55.71%
- **Target**: 60%+ for engine

## Unit Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { functionUnderTest } from './module'

describe('module', () => {
  it('should describe expected behavior', () => {
    const result = functionUnderTest(input)
    expect(result).toBe(expected)
  })
})
```

## Testing Patterns

| Test Type | Location | Pattern |
|----------|----------|---------|
| Unit | __tests__/*.test.ts | describe/it |
| Integration | __tests__/*.test.ts | simulate full flow |
| Component | __tests__/*.tsx | render with RTL |

## Common Test Patterns

```typescript
// Mock dependencies
vi.mock('../engine/module', () => ({
  mockFunction: vi.fn(),
}))

// Test error cases
it('should throw on invalid input', () => {
  expect(() => functionUnderTest(invalid)).toThrow()
})

// Test async
it('should resolve promise', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expected)
})
```

## Cross-references

- [[code-scaffold]] - Component scaffolding
- [[mock-fabricator]] - Mock data creation
- [[lint-fix]] - Fix test issues