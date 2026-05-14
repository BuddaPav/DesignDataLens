import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHRONOS_CONTRACT_PUBLIC_FILES,
  chronosGraphicsUrl,
} from '@/domain/assets/chronosGraphicsRegistry';

describe('CHRONOS_CONTRACT_PUBLIC_FILES', () => {
  it('entries are safe relative paths without traversal', () => {
    for (const rel of CHRONOS_CONTRACT_PUBLIC_FILES) {
      expect(rel).not.toContain('..');
      expect(rel.startsWith('/')).toBe(false);
    }
  });

  it('each path resolves via chronosGraphicsUrl', () => {
    for (const rel of CHRONOS_CONTRACT_PUBLIC_FILES) {
      const u = chronosGraphicsUrl(rel);
      expect(u.length).toBeGreaterThan(rel.length);
      expect(u).toContain(rel);
    }
  });

  const root = join(process.cwd(), 'public', 'assets', 'chronos-ai-chronicles');
  const marker = join(root, 'ui', 'chronos_glyph_placeholder.svg');

  describe.skipIf(!existsSync(marker))('public copies present (after prebuild / checkout)', () => {
    it.each([...CHRONOS_CONTRACT_PUBLIC_FILES])('exists %s', (rel) => {
      expect(existsSync(join(root, rel))).toBe(true);
    });
  });
});
