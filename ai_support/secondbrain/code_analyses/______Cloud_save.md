# - [ ] Cloud save

```typescript
```typescript
import { useState, useEffect } from 'react';
import { GameData } from './types';

const useCloudSave = (initialState: GameData): [GameData, (data: GameData) => void] => {
  const [gameData, setGameData] = useState<GameData>(initialState);

  useEffect(() => {
    // Fetch data from cloud
    const fetchFromCloud = async () => {
      try {
        const response = await fetch('/api/save');
        if (response.ok) {
          const savedData: GameData = await response.json();
          setGameData(savedData);
        }
      } catch (error) {
        console.error('Failed to load game data from cloud:', error);
      }
    };

    fetchFromCloud();
  }, []);

  useEffect(() => {
    // Save data to cloud
    const saveToCloud = async () => {
      try {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData),
        });
      } catch (error) {
        console.error('Failed to save game data to cloud:', error);
      }
    };

    saveToCloud();
  }, [gameData]);

  return [gameData, setGameData];
};

export default useCloudSave;
```
```

Generated: 2026-06-22T08:11:10.136Z