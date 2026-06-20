---
name: api-contract
description: Generate API contracts from TypeScript types. Use when designing APIs.
---

# API Contract

## When to use this skill

- Designing APIs
- Creating contracts
- TypeScript integration

## Contract Patterns

```typescript
// Input/Output contracts
interface API<TInput, TOutput> {
  input: TInput
  output: TOutput
  errors: Error[]
}
```

## Usage

- Engine APIs
- Hook contracts
- IPC communication

## Cross-references

- [[type-generator]] - Type generation
- [[schema-validator]] - Schema validation