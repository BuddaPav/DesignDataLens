// Chronos — сериализация сохранений (Map → JSON) и полный архив мира в IndexedDB.

const IDB_NAME = 'chronos_idb';
const IDB_STORE = 'saves';
const IDB_KEY = 'world_full';

/** Рекурсивно превращает Map в { __map: [ [k,v], ... ] } */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeMaps(value: any): any {
  if (value instanceof Map) {
    return { __type: 'Map', entries: [...value.entries()].map(([k, v]) => [k, serializeMaps(v)]) };
  }
  if (Array.isArray(value)) {
    return value.map(serializeMaps);
  }
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value)) {
      out[k] = serializeMaps(value[k]);
    }
    return out;
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reviveMaps(value: any): any {
  if (value && typeof value === 'object' && value.__type === 'Map' && Array.isArray(value.entries)) {
    return new Map(value.entries.map(([k, v]: [string, unknown]) => [k, reviveMaps(v)]));
  }
  if (Array.isArray(value)) {
    return value.map(reviveMaps);
  }
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value)) {
      out[k] = reviveMaps(value[k]);
    }
    return out;
  }
  return value;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

/** Положить полный снимок (уже сериализованный объект) в IndexedDB */
export async function saveFullWorldToIndexedDB(payload: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(payload, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadFullWorldFromIndexedDB(): Promise<unknown | null> {
  const db = await openDb();
  const data = await new Promise<unknown | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return data;
}

/** Удалить полный снимок из IndexedDB (сброс слота вместе с localStorage). */
export async function clearFullWorldFromIndexedDB(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
