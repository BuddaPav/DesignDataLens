import { describe, expect, it } from 'vitest';
import { getLocationStanding, locationReputationKey } from '@/domain/social/locationReputation';

describe('locationReputation', () => {
  it('normalizes keys', () => {
    expect(locationReputationKey('starting_village')).toBe('location:starting_village');
    expect(locationReputationKey('location:x')).toBe('location:x');
  });

  it('reads standing from map', () => {
    const m = new Map<string, number>([['location:a', 15]]);
    expect(getLocationStanding(m, 'a')).toBe(15);
    expect(getLocationStanding(m, 'location:a')).toBe(15);
    expect(getLocationStanding(m, 'missing')).toBe(0);
  });

  it('clamps out-of-range values defensively', () => {
    const m = new Map<string, number>([['location:x', 900]]);
    expect(getLocationStanding(m, 'x')).toBe(100);
  });
});
