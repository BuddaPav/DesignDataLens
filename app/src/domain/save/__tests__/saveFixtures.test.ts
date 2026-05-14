import { describe, expect, it } from 'vitest';
import { reviveMaps } from '@/engine/saveSystem';
import { CHRONOS_SAVE_SCHEMA_VERSION, migratePersistedSaveRevived } from '@/domain/save/saveSchema';
import minimalV1 from '@/domain/save/__fixtures__/minimal-v1.json';

describe('save fixtures', () => {
  it('loads minimal v1 JSON fixture and migrates to current schema', () => {
    const revived = reviveMaps(minimalV1);
    const r = migratePersistedSaveRevived(revived as { saveSchemaVersion?: number; timestamp: number });
    expect(r.ok).toBe(true);
    expect(revived.saveSchemaVersion).toBe(CHRONOS_SAVE_SCHEMA_VERSION);
  });
});
