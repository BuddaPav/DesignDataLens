# Проверка отсутствующих ссылок на спрайты при prebuild.

```typescript
```typescript
import fs from 'fs';
import path from 'path';

interface SpriteReference {
  filePath: string;
  spriteName: string;
}

const findSpriteReferences = (dirPath: string): SpriteReference[] => {
  const spriteRefs: SpriteReference[] = [];
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const matches = content.match(/src={require\('(.*)'\)}/g);

      if (matches) {
        for (const match of matches) {
          const spriteName = match.match(/'(.*)'/)[1];
          spriteRefs.push({ filePath, spriteName });
        }
      }
    }
  }

  return spriteRefs;
};

const checkMissingSprites = async () => {
  const spriteDirPath = path.join(__dirname, 'assets', 'sprites');
  const spriteRefs = findSpriteReferences(path.join(__dirname, 'src'));

  const existingSprites = await fs.promises.readdir(spriteDirPath);

  for (const ref of spriteRefs) {
    if (!existingSprites.includes(ref.spriteName)) {
      console.error(`Missing sprite: ${ref.spriteName} in file: ${ref.filePath}`);
    }
  }

  console.log('Sprite reference check completed.');
};

checkMissingSprites().catch(console.error);
```
```

Generated: 2026-06-22T06:06:36.485Z