/**
 * Баланс расширенной социальной симуляции (триады, цеха).
 * Единая точка правки чисел для `engine/societySimulation.ts`.
 */

/** Верхняя граница часов за один `advanceTime` для расчёта intensity. */
export const ADVANCED_SOCIETY_MAX_HOURS_PER_TICK = 168;

/** Минимум часов за тик (совпадает с clamp в useGameState advanceTime). */
export const ADVANCED_SOCIETY_MIN_HOURS_PER_TICK = 1;

/** Базовая вероятность попытки триады за тик (масштабируется intensity). */
export const TRIAD_ATTEMPT_BASE = 0.07;

/** Минимальный trust между A–B и B–C для усиления A–C. */
export const TRIAD_TRUST_THRESHOLD = 38;

/** Второй rng-порог после проверки trust. */
export const TRIAD_SECOND_GATE = 0.38;

/** Максимальное случайное усиление trust (добавляется к базе 1). */
export const TRIAD_BUMP_RANDOM_MAX = 2.5;

/** Доля от bump в affection. */
export const TRIAD_AFFECTION_FACTOR = 0.45;

/** Вероятность строки в журнал при успешной триаде. */
export const TRIAD_LOG_CHANCE = 0.2;

/** Множитель числа попыток «цеха» от размера профессии и intensity. */
export const GUILD_ATTEMPTS_PER_CAPITA = 0.18;

/** Пропуск межлокационной корректировки trust/affection. */
export const GUILD_ADJUST_SKIP_CHANCE = 0.09;

/** Вероятность журнала для цеха. */
export const GUILD_LOG_CHANCE = 0.24;

/** Амплитуда случайного дрейфа trust между удалёнными коллегами. */
export const GUILD_TRUST_DRIFT_AMPLITUDE = 7;

/** Амплитуда дрейфа affection. */
export const GUILD_AFFECTION_DRIFT_AMPLITUDE = 2.5;
