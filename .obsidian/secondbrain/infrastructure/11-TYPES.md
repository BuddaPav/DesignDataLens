---
tags: [knowledge, types]
type: types-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Types Encyclopedia

## Core Entities

### Player

```ts
interface Player {
  id: string;
  name: string;
  level: number;
  stats: PlayerStats;
  inventory: Inventory;
  location: string;
  reputation: Map<string, number>;
  quests: QuestProgress[];
}
```

### NPC

```ts
interface NPC {
  id: string;
  name: string;
  type: NPCType;
  personality: BigFive;
  stats: Stats;
  schedule: Schedule;
  relationships: Map<NPCId, Relationship>;
  playerRelationship: Relationship;
  location: Vector3;
  dialogue?: DialogueTree;
  quest?: QuestId;
}
```

### Item

```ts
interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  value: number;
  stats?: ItemStats;
  effects?: Effect[];
  stackable: boolean;
  maxStack: number;
}
```

### Quest

```ts
interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  objectives: Objective[];
  rewards: Reward[];
  giver: NPCId;
  require: QuestRequirement;
}
```

### Location

```ts
interface Location {
  id: string;
  name: string;
  type: LocationType;
  position: Vector3;
  biomes: Biome[];
  NPCs: NPCId[];
  POIs: POI[];
  locked: boolean;
  discovered: boolean;
}
```


## Enums

```ts
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type NPCType = 'citizen' | 'merchant' | 'guard' | 'quest_giver' | 'enemy';
type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest_item';
type QuestType = 'main' | 'side' | 'daily' | 'event';
```

## Utility Types


```ts
type Vector2 = { x: number; y: number };
type Vector3 = { x: number; y: number; z: number };
type Quaternion = { x: number; y: number; z: number; w: number };
type UUID = string & { readonly brand: unique symbol };
```
