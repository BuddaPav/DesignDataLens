/**
 * Когда выгоднее гонять распространение слухов в worker (тяжёлый тик времени).
 */
export const RUMOR_WORKER_MIN_HOURS = 24;
export const RUMOR_WORKER_MIN_RUMOR_COUNT = 18;

export function shouldSpreadRumorsInWorker(hours: number, rumorCount: number): boolean {
  const h = Number(hours);
  const n = Number(rumorCount);
  if (!Number.isFinite(h) || !Number.isFinite(n)) return false;
  return h >= RUMOR_WORKER_MIN_HOURS && n >= RUMOR_WORKER_MIN_RUMOR_COUNT;
}
