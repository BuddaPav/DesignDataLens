# Schema Registry для AFK Game

## Player Schema
```typescript
interface Player {
  id: string;           // UUID
  name: string;
  createdAt: number;    // timestamp
  character: Character;
  stats: PlayerStats;
  inventory: Inventory;
  storyProgress: StoryProgress;
  choices: ChoiceRecord[];
  archetype: PlayerArchetype;
  preferredTone: StoryTone;
  emotionalHistory: EmotionRecord[];
  lastSession: number;
  totalPlayTime: number;
  sessionCount: number;
}
```

## Character Schema
```typescript
interface Character {
  name: string;
  title: string;
  level: number;
  experience: number;
  hp: number;          // NEW (добавлено 2026-06-20)
  maxHp: number;       // NEW
  gold: number;       // NEW
  attributes: Attributes;
  appearance: Appearance;
  origin: string;
  backstory: string;
  worldEra?: WorldEra;
  personality: CharacterPersonality;
}
```

## NPC Schema
```typescript
interface NPC {
  id: string;
  name: string;
  archetype: NPCArchetype;
  mentalState: MentalState;
  dialogue: DialogueNode;
  location: TilePosition;
  schedules: Schedule[];
  inventory: Inventory;
}
```

## MentalState Schema (v2)
```typescript
interface MentalState {
  stress: number;
  happiness: number;
  trauma: number;
  anxiety: number;        // NEW
  trustBaseline: number; // NEW
}
```