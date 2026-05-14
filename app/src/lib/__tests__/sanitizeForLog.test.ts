import { describe, expect, it } from 'vitest';
import { sanitizeForLog } from '@/lib/sanitizeForLog';

describe('sanitizeForLog', () => {
  it('truncates long strings', () => {
    const s = 'x'.repeat(9000);
    const out = sanitizeForLog(s, 100);
    expect(out.length).toBeLessThanOrEqual(130);
    expect(out).toContain('[truncated]');
  });

  it('strips control chars', () => {
    expect(sanitizeForLog('a\u0000b')).toBe('a b');
  });
});
