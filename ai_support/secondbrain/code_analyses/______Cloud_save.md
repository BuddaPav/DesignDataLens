# - [ ] Cloud save

```typescript
```typescript
interface SaveData {
  level: number;
  score: number;
  bestScore: number;
}

const saveKey = "gameSave";

function saveGame(data: SaveData): void {
  localStorage.setItem(saveKey, JSON.stringify(data));
}

function loadGame(): SaveData | null {
  const savedData = localStorage.getItem(saveKey);
  return savedData ? JSON.parse(savedData) : null;
}
```
```

Generated: 2026-06-22T06:14:35.371Z