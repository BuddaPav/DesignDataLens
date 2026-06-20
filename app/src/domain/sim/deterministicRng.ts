/**
 * Детерминированный RNG для доменных симуляций (replay/qa).
 * Не криптостойкий; предназначен для воспроизводимых игровых тиков.
 */
export type DeterministicRng = () => number;

export function seedFromString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function createDeterministicRng(seed: number): DeterministicRng {
  let s = (seed >>> 0) || 1;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    s >>>= 0;
    return s / 4294967296;
  };
}

