# - [ ] Player-created content

```typescript
```typescript
type Content = {
  id: string;
  title: string;
  type: 'text' | 'image' | 'video';
  data: string; // Текст для текстового контента, URL для изображения или видео
};

class PlayerContentManager {
  private contentMap: Map<string, Content> = new Map();

  addContent(content: Content): void {
    this.contentMap.set(content.id, content);
  }

  getContent(id: string): Content | undefined {
    return this.contentMap.get(id);
  }

  deleteContent(id: string): void {
    this.contentMap.delete(id);
  }

  listAllContents(): Content[] {
    return Array.from(this.contentMap.values());
  }
}
```
```

Generated: 2026-06-22T06:18:14.583Z