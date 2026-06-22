# - [ ] Cloud save

```typescript
```typescript
import { GameSave, User } from '@/types/game';
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/localStorage';

const CLOUD_SAVE_KEY = 'chronos_cloud_save';

export function saveCloudGame(user: User, gameSave: GameSave): void {
  const cloudSave = {
    userId: user.id,
    saveData: gameSave
  };
  saveToLocalStorage(CLOUD_SAVE_KEY, cloudSave);
}

export function loadCloudGame(user: User): GameSave | null {
  const cloudSave = loadFromLocalStorage<GameSave>(CLOUD_SAVE_KEY);
  if (cloudSave && cloudSave.userId === user.id) {
    return cloudSave.saveData;
  }
  return null;
}
```

```typescript
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { saveCloudGame, loadCloudGame } from '@/engine/save';

interface Props {
  gameSave: GameSave;
}

export const CloudSaveProvider: React.FC<Props> = ({ gameSave }) => {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      saveCloudGame(user, gameSave);
    }
  }, [gameSave, user]);

  useEffect(() => {
    if (user) {
      const savedGame = loadCloudGame(user);
      if (savedGame) {
        // Handle loading the game state
      }
    }
  }, [user]);

  return null;
};
```

Этот код реализует сохранение и загрузку игры в облако для текущего пользователя. Используется локальное хранилище для демонстрации, но можно легко заменить его на реальное облакочное решение (например, Firebase Storage).

После написания кода запустите `npm run build` для проверки.
```

Generated: 2026-06-22T12:05:59.049Z