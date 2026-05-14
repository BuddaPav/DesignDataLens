import { describe, expect, it } from 'vitest';
import {
  RUMOR_WORKER_MIN_HOURS,
  RUMOR_WORKER_MIN_RUMOR_COUNT,
  RUMOR_WORKER_MIN_WORKLOAD,
  shouldSpreadRumorsInWorker,
} from '@/domain/social/gossipWorkerRules';

describe('shouldSpreadRumorsInWorker', () => {
  it('is false below hour or count thresholds when workload is low', () => {
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS - 1, RUMOR_WORKER_MIN_RUMOR_COUNT)).toBe(false);
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS, RUMOR_WORKER_MIN_RUMOR_COUNT - 1)).toBe(false);
    expect(shouldSpreadRumorsInWorker(10, 30)).toBe(false);
  });

  it('is true at classic thresholds', () => {
    expect(shouldSpreadRumorsInWorker(RUMOR_WORKER_MIN_HOURS, RUMOR_WORKER_MIN_RUMOR_COUNT)).toBe(true);
    expect(shouldSpreadRumorsInWorker(72, 40)).toBe(true);
  });

  it('is true when hours × rumorCount reaches workload even if hours < 24', () => {
    expect(shouldSpreadRumorsInWorker(12, 44)).toBe(true);
    expect(12 * 44).toBeGreaterThanOrEqual(RUMOR_WORKER_MIN_WORKLOAD);
  });

  it('is false for zero rumors', () => {
    expect(shouldSpreadRumorsInWorker(100, 0)).toBe(false);
  });
});
