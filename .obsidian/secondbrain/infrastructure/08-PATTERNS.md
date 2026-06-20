---
tags: [knowledge, patterns]
type: patterns-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Patterns Encyclopedia

## Design Patterns

### Game Loop

```ts
function gameLoop() {
  // 1. Input
  handleInput();
  
  // 2. Update
  updateEntities();
  updateAI();
  
  // 3. Render
  render();
  
  // 4. Schedule next
  requestAnimationFrame(gameLoop);
}
```

### State Machine

```ts
type State = 'idle' | 'walking' | 'combat' | 'dialogue';

const transitions: Record<State, State[]> = {
  idle: ['walking', 'combat'],
  walking: ['idle', 'combat', 'dialogue'],
  combat: ['idle'],
  dialogue: ['idle'],
};
```


### Observer (Events)


```ts
// Emit
emitter.emit('event', data);


// Subscribe
emitter.on('event', handler);
```

### Singleton (Game State)


```ts
const gameState = new GameState();
export function useGame() {
  return gameState;
}
```

### Repository (Data)


```ts
interface Repository<T> {
  get(id: string): Promise<T>;
  save(entity: T): Promise<void>;
  query(filter: Filter): Promise<T[]>;
}
```

## React Patterns

### Custom Hooks

```ts
export function useFeature(flag: FeatureFlag) {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    setEnabled(isEnabled(flag));
  }, [flag]);
  
  return enabled;
}
```

### Compound Components

```tsx
<Select>
  <Select.Trigger>
    <Select.Option value="">...</Select.Option>
  </Select.Trigger>
</Select>
```

### Render Props

```tsx
function GameList({ renderItem }) {
  return items.map(item => renderItem(item));
}
```

## Performance Patterns

| Pattern | Use Case |
|---------|---------|
| Object pooling | Bullets, particles |
| Spatial hash | Collision detection |
| LOD | Distant objects |
| Frustum cull | Off-screen rendering |
| Instance mesh | Multiple same objects |
