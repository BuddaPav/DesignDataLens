---
name: exploration-tracker
description: Track world exploration and discovery progress. Use when tracking explored areas.
---

# Exploration Tracker

## When to use this skill

- Tracking player exploration
- Discovery progress monitoring
- Area completion tracking

## Exploration Structure

```typescript
interface ExplorationState {
  discoveredAreas: Set<string>
  visitedPOIs: Set<string>
  explorationPercent: number
}
```

## Operations

- Mark areas discovered
- Calculate completion
- Track unique discoveries

## Cross-references

- [[world-generator]] - World
- [[poi-manager]] - POIs
- [[mini-map-generator]] - Minimap