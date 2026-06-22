# [STAGE 074] EN-проход процедурных строк каталога предметов (не всего движка).

```typescript
```typescript
function parseCatalogItems(catalogData: string[]): { name: string, description: string }[] {
  return catalogData.map(item => {
    const [name, description] = item.split(': ');
    return { name, description };
  });
}
```
```

Generated: 2026-06-22T08:03:32.321Z