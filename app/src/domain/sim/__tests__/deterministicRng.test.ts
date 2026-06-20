import { describe, expect, it } from 'vitest';

import { createDeterministicRng, seedFromString } from '@/domain/sim/deterministicRng';

describe('deterministicRng', () => {
  it('returns same sequence for same seed', () => {
    const a = createDeterministicRng(42);
    const b = createDeterministicRng(42);
    const left = Array.from({ length: 16 }, () => a());
    const right = Array.from({ length: 16 }, () => b());
    expect(right).toEqual(left);
  });

  it('seedFromString is stable for same input', () => {
    const s1 = seedFromString('world:tick:100');
    const s2 = seedFromString('world:tick:100');
    const s3 = seedFromString('world:tick:101');
    expect(s2).toBe(s1);
    expect(s3).not.toBe(s1);
  });
});

