import { describe, expect, it } from 'vitest';
import type { DelayedConsequencePending } from '@/types/game';
import {
  collectDelayedConsequenceLogLines,
  formatDelayedConsequenceLine,
  MAX_DELAYED_LOG_LINES,
} from '@/domain/consequences/delayedConsequenceJournal';

function pending(
  partial: Partial<DelayedConsequencePending> & Pick<DelayedConsequencePending, 'consequence'>,
): DelayedConsequencePending {
  return {
    id: 'dcon_test',
    remainingHours: 6,
    source: 'dialogue',
    locationId: 'starting_village',
    ...partial,
  };
}

describe('delayedConsequenceJournal', () => {
  it('formats reputation_change with localized faction line', () => {
    const line = formatDelayedConsequenceLine(
      pending({
        consequence: { type: 'reputation_change', key: 'academy', value: 2 },
      }),
      'en',
      'release',
    );
    expect(line).toContain('Academy');
    expect(line).toContain('Willbrook Village');
  });

  it('uses world_event message when present', () => {
    const line = formatDelayedConsequenceLine(
      pending({
        consequence: {
          type: 'world_event',
          key: 'echo',
          value: { message: 'The marsh remembers.' },
        },
      }),
      'en',
      'release',
    );
    expect(line).toContain('The marsh remembers.');
  });

  it('respects maxLines cap', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      pending({
        id: `dcon_${i}`,
        consequence: { type: 'gold', key: 'gold', value: i + 1 },
      }),
    );
    const lines = collectDelayedConsequenceLogLines(items, 'en', 'release', 2);
    expect(lines).toHaveLength(2);
    expect(MAX_DELAYED_LOG_LINES).toBe(6);
  });

  it('skips unknown consequence types', () => {
    const line = formatDelayedConsequenceLine(
      pending({
        consequence: { type: 'story_flag', key: 'flag', value: true },
      }),
      'en',
      'enqueue',
    );
    expect(line).toBeNull();
  });
});
