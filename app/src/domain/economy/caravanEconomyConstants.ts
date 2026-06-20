/**
 * Параметры локального «предложения» от караванов (`market_supply:<locationId>` в `factionPowers`).
 * См. `caravanEconomy.ts`, `shopPurchase.ts`, `advanceTime` в `useGameState`.
 */
export const CHRONOS_MARKET_SUPPLY_MIN = 0;
export const CHRONOS_MARKET_SUPPLY_MAX = 100;
/** Прибавка supply за уникальный визит каравана за один тик времени (до clamp). */
export const CHRONOS_MARKET_SUPPLY_VISIT_BOOST = 12;
/** Декей за час: supply(t+h) ≈ supply(t) × decay^h. */
export const CHRONOS_MARKET_SUPPLY_DECAY_PER_HOUR = 0.985;

/** Пороги «тональности» рынка для UI лавки (0 = нет товара, дорого). */
export const CHRONOS_MARKET_TONE_TIGHT_BELOW = 22;
export const CHRONOS_MARKET_TONE_FLUID_ABOVE = 48;
