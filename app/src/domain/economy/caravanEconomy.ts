/**
 * Экономический след от караванов: визиты повышают "предложение" в локации на короткое время.
 * Храним значения в `worldState.factionPowers` (Map) как single source of truth, чтобы не плодить новые хранилища.
 */
import {
  CHRONOS_MARKET_SUPPLY_DECAY_PER_HOUR,
  CHRONOS_MARKET_SUPPLY_MAX,
  CHRONOS_MARKET_SUPPLY_MIN,
  CHRONOS_MARKET_SUPPLY_VISIT_BOOST,
  CHRONOS_MARKET_TONE_FLUID_ABOVE,
  CHRONOS_MARKET_TONE_TIGHT_BELOW,
} from '@/domain/economy/caravanEconomyConstants';

export type MarketSupplyKey = `market_supply:${string}`;

const SUPPLY_KEY_PREFIX = 'market_supply:' as const;

function clampSupply(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(CHRONOS_MARKET_SUPPLY_MIN, Math.min(CHRONOS_MARKET_SUPPLY_MAX, v));
}

export function marketSupplyKeyForLocation(locationId: string): MarketSupplyKey {
  return `${SUPPLY_KEY_PREFIX}${locationId}`;
}

export function readMarketSupplyForLocation(
  factionPowers: Map<string, number> | undefined,
  locationId: string,
): number {
  if (!factionPowers?.size) return 0;
  const k = marketSupplyKeyForLocation(locationId);
  const v = factionPowers.get(k);
  return typeof v === 'number' && Number.isFinite(v) ? clampSupply(v) : 0;
}

export type MarketTone = 'tight' | 'neutral' | 'fluid';

/** Грубая шкала для подписи в лавке: караваны подняли supply → дешевле золотые цены. */
export function marketToneFromSupply(supply: number): MarketTone {
  const s = clampSupply(supply);
  if (s < CHRONOS_MARKET_TONE_TIGHT_BELOW) return 'tight';
  if (s > CHRONOS_MARKET_TONE_FLUID_ABOVE) return 'fluid';
  return 'neutral';
}

/**
 * Декей: supply(t+h) = supply(t) * decayRate^h.
 * При visit +SUPPLY_VISIT_BOOST, затем clamp.
 */
export function applyMarketSupplyFromCaravanVisits(
  prev: Map<string, number>,
  visitedLocationIds: string[],
  hours: number,
  decayRatePerHour = CHRONOS_MARKET_SUPPLY_DECAY_PER_HOUR,
): Map<string, number> {
  const h = Math.max(0, Math.round(hours));
  const decay = Math.pow(decayRatePerHour, h);
  const next = new Map<string, number>();

  for (const [k, v] of prev.entries()) {
    if (typeof k !== 'string') continue;
    if (!k.startsWith(SUPPLY_KEY_PREFIX)) {
      next.set(k, v);
      continue;
    }
    next.set(k, clampSupply((v ?? 0) * decay));
  }

  if (visitedLocationIds.length > 0) {
    const unique = new Set(visitedLocationIds.filter(Boolean));
    for (const locId of unique) {
      const k = marketSupplyKeyForLocation(locId);
      const cur = next.get(k) ?? 0;
      next.set(k, clampSupply(cur + CHRONOS_MARKET_SUPPLY_VISIT_BOOST));
    }
  }

  return next;
}

/**
 * Чем выше supply, тем дешевле/доступнее базовые товары.
 * Возвращает мультипликатор 0.7..1.15 (без экстремумов).
 */
export function priceMultiplierFromMarketSupply(supply: number): number {
  const s = clampSupply(supply);
  const m = 1 - s / 300;
  return Math.max(0.7, Math.min(1.15, Math.round(m * 1000) / 1000));
}

