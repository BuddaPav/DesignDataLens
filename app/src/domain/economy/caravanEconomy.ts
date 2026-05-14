/**
 * Экономический след от караванов: визиты повышают "предложение" в локации на короткое время.
 * Храним значения в `worldState.factionPowers` (Map) как single source of truth, чтобы не плодить новые хранилища.
 */
export type MarketSupplyKey = `market_supply:${string}`;

const SUPPLY_KEY_PREFIX = 'market_supply:' as const;
const SUPPLY_MIN = 0;
const SUPPLY_MAX = 100;
const SUPPLY_VISIT_BOOST = 12;

function clampSupply(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(SUPPLY_MIN, Math.min(SUPPLY_MAX, v));
}

export function marketSupplyKeyForLocation(locationId: string): MarketSupplyKey {
  return `${SUPPLY_KEY_PREFIX}${locationId}`;
}

/**
 * Декей: supply(t+h) = supply(t) * decayRate^h.
 * При visit +SUPPLY_VISIT_BOOST, затем clamp.
 */
export function applyMarketSupplyFromCaravanVisits(
  prev: Map<string, number>,
  visitedLocationIds: string[],
  hours: number,
  decayRatePerHour = 0.985,
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
      next.set(k, clampSupply(cur + SUPPLY_VISIT_BOOST));
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

