/**
 * Отложенная доля последствий распространения слухов по фракциям (MVP 083).
 * Часть дельты применяется сразу, остальное — после игровых часов (очередь на advanceTime).
 */
import type { RumorConsequencePending } from '@/types/game';

/** Доля репутационного эффекта слуха, переносимая на отложенный «отклик». */
export const CHRONOS_RUMOR_REP_RIPPLE_FRACTION = 0.38;

/** Базовая задержка перед отложенной долей (часы), к ней добавляется детерминированный джиттер по ключу фракции. */
export const CHRONOS_RUMOR_RIPPLE_DELAY_BASE_HOURS = 8;

/** Ниже этого модуля дельты не делим — уходит целиком в немедленное применение. */
export const CHRONOS_RUMOR_RIPPLE_SPLIT_MIN_ABS = 1.15;

function jitterHoursForKey(factionKey: string): number {
  let s = 0;
  for (let i = 0; i < factionKey.length; i++) s = (s + factionKey.charCodeAt(i) * (i + 3)) % 7;
  return s;
}

export function splitRumorReputationRipple(
  rawDelta: Record<string, number>,
): { immediate: Record<string, number>; pending: RumorConsequencePending[] } {
  const immediate: Record<string, number> = {};
  const pending: RumorConsequencePending[] = [];

  for (const [k, v] of Object.entries(rawDelta)) {
    if (!Number.isFinite(v) || v === 0) continue;

    if (Math.abs(v) < CHRONOS_RUMOR_RIPPLE_SPLIT_MIN_ABS) {
      immediate[k] = (immediate[k] ?? 0) + v;
      continue;
    }

    const later = v * CHRONOS_RUMOR_REP_RIPPLE_FRACTION;
    const now = v - later;

    if (Math.abs(now) >= 1e-8) {
      immediate[k] = (immediate[k] ?? 0) + now;
    }
    if (Math.abs(later) >= 1e-8) {
      pending.push({
        id: `rumor_ripple_${k}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        remainingHours: CHRONOS_RUMOR_RIPPLE_DELAY_BASE_HOURS + jitterHoursForKey(k),
        factionRepDelta: { [k]: later },
      });
    }
  }

  return { immediate, pending };
}

export function tickRumorConsequenceQueue(
  queue: RumorConsequencePending[],
  hoursAdvanced: number,
): { queue: RumorConsequencePending[]; releasedReputationDelta: Record<string, number> } {
  const h = Math.max(0, hoursAdvanced);
  const releasedReputationDelta: Record<string, number> = {};
  const next: RumorConsequencePending[] = [];

  for (const item of queue) {
    const rem = item.remainingHours - h;
    if (rem <= 0) {
      for (const [fk, val] of Object.entries(item.factionRepDelta)) {
        if (!Number.isFinite(val) || val === 0) continue;
        releasedReputationDelta[fk] = (releasedReputationDelta[fk] ?? 0) + val;
      }
    } else {
      next.push({ ...item, remainingHours: rem });
    }
  }

  return { queue: next, releasedReputationDelta };
}
