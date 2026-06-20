---
name: ai-behaviour-tree
description: Create behaviour trees for NPC AI. Use when designing NPC decision logic.
---

# AI Behaviour Tree

## When to use this skill

- NPC decision making
- State machines
- Behaviour sequences

## Tree Structure

```typescript
interface BTNode {
  type: 'selector' | 'sequence' | 'action' | 'condition'
  children?: BTNode[]
  evaluate: () => boolean
}
```

## Common Nodes

- Selector: Try children until success
- Sequence: Run children in order
- Condition: Check game state
- Action: Perform behavior

## Cross-references

- [[npc-generator]] - NPC generation
- [[emotion-engine]] - Emotions