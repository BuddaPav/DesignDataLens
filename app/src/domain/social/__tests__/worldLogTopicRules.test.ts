import { describe, expect, it } from 'vitest';
import { isWorldLogEntrySocial } from '@/domain/social/worldLogTopicRules';

describe('worldLogTopicRules', () => {
  it('treats explicit topic social as social', () => {
    expect(
      isWorldLogEntrySocial({
        id: '1',
        timestamp: 1,
        message: 'Gold +50',
        severity: 'info',
        topic: 'social',
      }),
    ).toBe(true);
  });

  it('uses severity rumor and dramatic', () => {
    expect(isWorldLogEntrySocial({ id: '1', timestamp: 1, message: 'x', severity: 'rumor' })).toBe(true);
    expect(isWorldLogEntrySocial({ id: '1', timestamp: 1, message: 'x', severity: 'dramatic' })).toBe(true);
  });

  it('matches legacy reputation keywords', () => {
    expect(isWorldLogEntrySocial({ id: '1', timestamp: 1, message: 'Reputation with merchants shifts.', severity: 'info' })).toBe(
      true,
    );
  });
});
