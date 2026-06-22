# - [ ] Player-created content

```typescript
```typescript
interface PlayerContent {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
}

class ContentManager {
  private static instance: ContentManager | null = null;

  private constructor() {}

  public static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  public createContent(playerId: string, type: PlayerContent['type'], content: string): PlayerContent {
    const id = this.generateUniqueId();
    return { id, type, content };
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Пример использования
const contentManager = ContentManager.getInstance();
const newContent = contentManager.createContent('player123', 'text', 'Hello, world!');
console.log(newContent); // { id: ..., type: 'text', content: 'Hello, world!' }
```
```

Generated: 2026-06-22T08:12:00.463Z