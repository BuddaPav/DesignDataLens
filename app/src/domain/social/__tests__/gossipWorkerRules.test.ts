import { describe, expect, it } from 'vitest';
import {
  RUMOR_WORKER_MIN_HOURS,
  RUMOR_WORKER_MIN_RUMOR_COUNT,
  shouldSpreadRumorsInWorker,
} from '@/domain/social/gossipWorkerRules';

describe('shouldSpreadRumorsInWorker', () => {
  it('is false below hour or count thresholds', () => {
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS - 1, RUMOR_WORKER_MIN_RUMOR_COUNT)).toBe(false);
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS, RUMOR_WORKER_MIN_RUMOR_COUNT - 1)).toBe(false);
  });

  it('is true at thresholds', () => {
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS, RUMOR_WORKER_MIN_RUMOR_COUNT)).toBe(true);
    expect(shouldSpreadRumorsInWorker(72, 40)).toBe(true);
  });
});
