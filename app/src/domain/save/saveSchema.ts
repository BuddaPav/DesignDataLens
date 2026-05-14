/**
 * Версия сериализованного снимка (`chronos_save` / IndexedDB).
 * Увеличивать при несовместимых изменениях структуры + добавить шаг в `migratePersistedSaveRevived`.
 */
export const CHRONOS_SAVE_SCHEMA_VERSION = 2;

export type PersistedChronosSave = {
  saveSchemaVersion?: number;
  timestamp: number;
  /** Прочие поля задаёт `useGameState` — тип минимальный для миграций. */
  [key: string]: unknown;
};

export type MigratePersistedSaveResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported_forward_schema'; version: number };

/** После `reviveMaps`: поднять версию и подлатать поля между версиями. */
export function migratePersistedSaveRevived(data: PersistedChronosSave): MigratePersistedSaveResult {
  const from = typeof data.saveSchemaVersion === 'number' ? data.saveSchemaVersion : 1;
  if (from > CHRONOS_SAVE_SCHEMA_VERSION) {
    return { ok: false, reason: 'unsupported_forward_schema', version: from };
  }
  if (from < 2) {
    // v1 → v2: структура совместима с текущим кодом; точечные патчи при необходимости.
  }
  data.saveSchemaVersion = CHRONOS_SAVE_SCHEMA_VERSION;
  return { ok: true };
}
