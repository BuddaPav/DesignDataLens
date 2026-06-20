---
name: world-generator
description: Generate game world procedurally. Use when creating new map areas.
---

# World Generator

## When to use this skill

- Generating map tiles
- Procedural generation
- Biome placement

## World Structure

```typescript
interface World {
  tiles: TileData[]
  biomes: Biome[]
  size: number
}
```

## Cross-references

- [[biome-creator]] - Biomes
- [[map-painter]] - Map rendering