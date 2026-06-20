---
tags: [knowledge, database]
type: storage-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Storage Encyclopedia

## Local Storage

### IndexedDB (Game State)


```ts
const db = await openDB('chronos', 1, {
  upgrade(db) {
    // Players store
    db.createObjectStore('players', { keyPath: 'id' });
    // Saves store
    db.createObjectStore('saves', { keyPath: 'id' });
    // Settings store
    db.createObjectStore('settings');
  },
});
```

### Schema Evolution

```ts
const MIGRATIONS = [
  {
    version: 1,
    migrate: (db) => { /* v1 schema */ },
  },
  {
    version: 2,
    migrate: (db) => { /* add new field */ },
  },
];
```

## Data Retention

| Data Type | Storage | Retention |
|----------|---------|-----------|
| Save games | IndexedDB | unlimited |
| Settings | localStorage | unlimited |
| Player state | IndexedDB | current session |
| Cache | memory | until close |

## Backup Strategy

1. Auto-save: Every 5 min
2. Checkpoint: After quests
3. Export: Manual JSON
4. Cloud: Future feature

## Compression

- Use `pako` for saves > 1MB
- Gzip level 6 (balanced)
- Store compressed in IDB

## Migration Plans

### Local > Cloud (Future)

- Export local as JSON
- Import to cloud
- Maintain local as cache

## Security

- No PII in local storage
- Encrypt sensitive data
- Validate on load
