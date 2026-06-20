/**
 * Dev-only телеметрия: localStorage `chronos_debug_telemetry=1` включает замеры.
 * В продакшене по умолчанию поведение no-op для безопасности и производительности.
 */

const STORAGE_KEY = 'chronos_debug_telemetry';

export function isTelemetryEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function traceSync<T>(label: string, fn: () => T): T {
  if (!isTelemetryEnabled()) return fn();
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    const ms = performance.now() - t0;
    console.debug(`[chronos/telemetry] ${label} ${ms.toFixed(2)}ms`);
  }
}

export async function traceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isTelemetryEnabled()) return fn();
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    const ms = performance.now() - t0;
    console.debug(`[chronos/telemetry] ${label} ${ms.toFixed(2)}ms`);
  }
}

const callCounts = new Map<string, number>();

export function profileCalls(key: string): void {
  if (!isTelemetryEnabled()) return;
  callCounts.set(key, (callCounts.get(key) ?? 0) + 1);
}

export function resetProfileCalls(): void {
  callCounts.clear();
}

export function getProfileCallsSnapshot(): ReadonlyMap<string, number> {
  return new Map(callCounts);
}

let llmWeightLoadOk = 0;
let llmWeightLoadFail = 0;

/** Успех/неудача загрузки весов WebLLM (MVP 062). */
export function recordLlmWeightLoad(outcome: 'ok' | 'fail'): void {
  if (outcome === 'ok') llmWeightLoadOk++;
  else llmWeightLoadFail++;
  if (isTelemetryEnabled()) {
    console.debug('[chronos/telemetry] llm_weight_load', {
      ok: llmWeightLoadOk,
      fail: llmWeightLoadFail,
      last: outcome,
    });
  }
}

export function getLlmWeightLoadSnapshot(): { ok: number; fail: number } {
  return { ok: llmWeightLoadOk, fail: llmWeightLoadFail };
}

export function resetLlmWeightLoadCounters(): void {
  llmWeightLoadOk = 0;
  llmWeightLoadFail = 0;
}

// --- R3F FPS (BACKLOG #16): только при `chronos_debug_telemetry=1` ---
let r3fLastTs = 0;
let r3fEmaFps = 60;
let r3fLowWarned = false;
const r3fTierEma = new Map<string, number>();

/** Вызывать из одного `useFrame` в Canvas (React Three Fiber). */
export function recordR3fFrameTick(tier: 'low' | 'balanced' | 'high' = 'balanced'): void {
  if (!isTelemetryEnabled()) return;
  const now = performance.now();
  if (r3fLastTs > 0) {
    const dt = Math.max(1e-6, now - r3fLastTs);
    const inst = 1000 / dt;
    r3fEmaFps = r3fEmaFps * 0.92 + inst * 0.08;
    const prevTier = r3fTierEma.get(tier) ?? 60;
    const nextTier = prevTier * 0.92 + inst * 0.08;
    r3fTierEma.set(tier, nextTier);
    if (r3fEmaFps < 47 && !r3fLowWarned) {
      r3fLowWarned = true;
      console.warn('[chronos/telemetry] R3F FPS (EMA) ниже ~50:', r3fEmaFps.toFixed(1));
    }
    if (r3fEmaFps > 54) r3fLowWarned = false;
  }
  r3fLastTs = now;
}

export function resetR3fFpsTelemetry(): void {
  r3fLastTs = 0;
  r3fEmaFps = 60;
  r3fLowWarned = false;
  r3fTierEma.clear();
}

export function getR3fFpsEmaSnapshot(): number {
  return r3fEmaFps;
}

export function getR3fFpsEmaByTierSnapshot(): ReadonlyMap<string, number> {
  return new Map(r3fTierEma);
}
