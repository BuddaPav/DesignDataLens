import { describe, expect, it } from 'vitest';
import { CHRONOS_SAVE_SCHEMA_VERSION, migratePersistedSaveRevived } from '@/domain/save/saveSchema';

describe('saveSchema', () => {
  it('assigns current version when missing', () => {
    const d: { timestamp: number; saveSchemaVersion?: number } = { timestamp: 1 };
    const r = migratePersistedSaveRevived(d);
    expect(r.ok).toBe(true);
    expect(d.saveSchemaVersion).toBe(CHRONOS_SAVE_SCHEMA_VERSION);
  });

  it('bumps legacy v1 marker', () => {
    const d = { saveSchemaVersion: 1, timestamp: 1 };
    const r = migratePersistedSaveRevived(d);
    expect(r.ok).toBe(true);
    expect(d.saveSchemaVersion).toBe(CHRONOS_SAVE_SCHEMA_VERSION);
  });

  it('rejects forward-incompatible schema without mutating version field upward', () => {
    const d = { saveSchemaVersion: 999, timestamp: 1 };
    const r = migratePersistedSaveRevived(d);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unsupported_forward_schema');
    expect(d.saveSchemaVersion).toBe(999);
  });
});
