import { describe, expect, it } from 'vitest';
import {
  detectObligationKinds,
  enqueuePlayerObligations,
  tickPlayerObligationQueue,
} from '@/domain/consequences/playerObligationQueue';

describe('playerObligationQueue', () => {
  it('detects promise and debt from dialogue', () => {
    expect(detectObligationKinds('I promise to help you with the caravan')).toContain('promise');
    expect(detectObligationKinds('Я должен вернуть долг до заката')).toContain('debt');
  });

  it('releases quest consequences after enough hours', () => {
    const queue = enqueuePlayerObligations([], ['promise'], 'river_port', 'npc_1', 12);
    const tick = tickPlayerObligationQueue(queue, 12, 'en');
    expect(tick.queue).toHaveLength(0);
    expect(tick.released.some((c) => c.type === 'quest_unlock')).toBe(true);
    expect(tick.logLines.length).toBeGreaterThan(0);
  });
});
