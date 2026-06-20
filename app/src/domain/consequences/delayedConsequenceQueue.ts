import type { Consequence, DelayedConsequencePending } from '@/types/game';

type DelayedConsequenceSource = 'choice' | 'dialogue' | 'world';

export const MIN_DELAY_HOURS = 1;
export const MAX_DELAYED_CONSEQUENCES = 120;
export const MAX_DUPLICATES_PER_SIGNATURE = 2;

function normalizedDelayHours(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(MIN_DELAY_HOURS, Math.floor(n));
}

/** Stable per signature + global queue index — unique across repeated enqueues. */
function makePendingId(base: string, seq: number): string {
  let h = 2166136261;
  const material = `${base}:${seq}`;
  for (let i = 0; i < material.length; i += 1) {
    h ^= material.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `dcon_${(h >>> 0).toString(36)}`;
}

function stripDelay(consequence: Consequence): Consequence {
  const { delay: _delay, ...rest } = consequence;
  return rest;
}

function signatureOf(p: DelayedConsequencePending): string {
  return `${p.source}:${p.locationId}:${p.consequence.type}:${p.consequence.key}:${JSON.stringify(p.consequence.value)}`;
}

function compactAndCapQueue(queue: DelayedConsequencePending[]): DelayedConsequencePending[] {
  if (queue.length <= 1) return queue;
  const bySig = new Map<string, DelayedConsequencePending[]>();
  for (const item of queue) {
    const sig = signatureOf(item);
    const bucket = bySig.get(sig);
    if (bucket) {
      bucket.push(item);
    } else {
      bySig.set(sig, [item]);
    }
  }

  const compacted: DelayedConsequencePending[] = [];
  for (const bucket of bySig.values()) {
    bucket.sort((a, b) => a.remainingHours - b.remainingHours);
    compacted.push(...bucket.slice(0, MAX_DUPLICATES_PER_SIGNATURE));
  }

  if (compacted.length <= MAX_DELAYED_CONSEQUENCES) return compacted;
  compacted.sort((a, b) => a.remainingHours - b.remainingHours);
  return compacted.slice(0, MAX_DELAYED_CONSEQUENCES);
}

export function enqueueDelayedConsequences(
  queue: DelayedConsequencePending[],
  consequences: Consequence[],
  source: DelayedConsequenceSource,
  locationId: string,
): DelayedConsequencePending[] {
  const additions = consequences
    .map((c) => ({ c, d: normalizedDelayHours(c.delay) }))
    .filter((x) => x.d > 0);
  if (additions.length === 0) return queue;

  const next = [...queue];
  additions.forEach(({ c, d }) => {
    const key = `${source}:${locationId}:${c.type}:${c.key}:${JSON.stringify(c.value)}`;
    const seq = next.length;
    next.push({
      id: makePendingId(key, seq),
      remainingHours: d,
      source,
      locationId,
      consequence: stripDelay(c),
    });
  });
  return compactAndCapQueue(next);
}

/** Releases matured items; `released` keeps full pending metadata for journal/UI. */
export function tickDelayedConsequencesQueue(
  queue: DelayedConsequencePending[],
  elapsedHours: number,
): {
  queue: DelayedConsequencePending[];
  released: DelayedConsequencePending[];
} {
  const h = Math.max(0, Math.floor(elapsedHours));
  if (h <= 0 || queue.length === 0) return { queue, released: [] };

  const next: DelayedConsequencePending[] = [];
  const released: DelayedConsequencePending[] = [];
  for (const p of queue) {
    const remaining = p.remainingHours - h;
    if (remaining <= 0) {
      released.push(p);
    } else {
      next.push({ ...p, remainingHours: remaining });
    }
  }
  return { queue: compactAndCapQueue(next), released };
}

export function delayedConsequenceStats(queue: DelayedConsequencePending[] | undefined): {
  count: number;
  minHours: number;
  maxHours: number;
} {
  const list = queue ?? [];
  if (list.length === 0) return { count: 0, minHours: 0, maxHours: 0 };
  let minHours = Number.POSITIVE_INFINITY;
  let maxHours = 0;
  for (const item of list) {
    minHours = Math.min(minHours, item.remainingHours);
    maxHours = Math.max(maxHours, item.remainingHours);
  }
  return { count: list.length, minHours, maxHours };
}
