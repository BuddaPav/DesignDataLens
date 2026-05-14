/**
 * Когда выгоднее гонять распространение слухов в worker (тяжёлый тик времени).
 */
export const RUMOR_WORKER_MIN_HOURS = 24;
export const RUMOR_WORKER_MIN_RUMOR_COUNT = 18;

/**
 * Доп. порог: произведение часов × число слухов (оценка работы цикла spread).
 * Позволяет уйти в worker при 12–23 ч, если слухов очень много.
 */
export const RUMOR_WORKER_MIN_WORKLOAD = 520;

// DECISION: workload = h×n вместо отдельной симуляции сложности графа — дешёвая эвристика, синхрон с целью «не блокировать UI»; альтернатива — профилировать реальный wall time (отложено).
export function shouldSpreadRumorsInWorker(hours: number, rumorCount: number): boolean {
  const h = Number(hours);
  const n = Number(rumorCount);
  if (!Number.isFinite(h) || !Number.isFinite(n)) return false;
  if (n <= 0) return false;
  if (h >= RUMOR_WORKER_MIN_HOURS && n >= RUMOR_WORKER_MIN_RUMOR_COUNT) return true;
  if (h * n >= RUMOR_WORKER_MIN_WORKLOAD) return true;
  return false;
}
