// Chronos — психология NPC: стресс, счастье, травма и реакции на события.
// Числа 0–100; изменения клампятся, чтобы UI и промпты оставались стабильными.

import type { MentalState, NPC } from '@/types/game';
import type { Language } from '@/i18n';

/** Стартовое состояние для нового NPC */
export function defaultMentalState(): MentalState {
  return {
    stress: 25 + Math.floor(Math.random() * 15),
    happiness: 45 + Math.floor(Math.random() * 20),
    trauma: 5 + Math.floor(Math.random() * 15),
    anxiety: 20 + Math.floor(Math.random() * 20),
    trustBaseline: 50 + Math.floor(Math.random() * 15)
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Применить к психике последствия социального/опасного события */
export function applyMentalEvent(state: MentalState, opts: { stressDelta?: number; happinessDelta?: number; traumaDelta?: number }): MentalState {
  const next = {
    stress: clamp(state.stress + (opts.stressDelta ?? 0), 0, 100),
    happiness: clamp(state.happiness + (opts.happinessDelta ?? 0), 0, 100),
    trauma: clamp(state.trauma + (opts.traumaDelta ?? 0), 0, 100),
    anxiety: clamp(state.anxiety + (opts.stressDelta ?? 0) * 0.5, 0, 100),
    trustBaseline: clamp(state.trustBaseline - (opts.traumaDelta ?? 0) * 0.3, 0, 100)
  };
  // Сильный стресс «съедает» счастье чуть-чуть
  if (next.stress > 75) {
    next.happiness = clamp(next.happiness - 1, 0, 100);
  }
  return next;
}

/** Влияние отрицательного общения с игроком */
export function applyNegativePlayerInteraction(npc: NPC, magnitude: number): void {
  const m = Math.min(40, Math.abs(magnitude));
  npc.mentalState = applyMentalEvent(npc.mentalState, {
    stressDelta: m * 0.8,
    happinessDelta: -m * 0.6,
    traumaDelta: m > 25 ? m * 0.15 : 0
  });
}

/** Влияние положительного общения */
export function applyPositivePlayerInteraction(npc: NPC, magnitude: number): void {
  const m = Math.min(35, Math.abs(magnitude));
  npc.mentalState = applyMentalEvent(npc.mentalState, {
    stressDelta: -m * 0.4,
    happinessDelta: m * 0.7,
    traumaDelta: -m * 0.05
  });
}

/** Лёгкая деградация/восстановление за время (пропуск часов) */
export function driftMentalState(state: MentalState, hours: number): MentalState {
  const h = Math.min(72, hours);
  const relax = h * 0.15;
  return {
    stress: clamp(state.stress - relax * 0.3, 0, 100),
    happiness: clamp(state.happiness + relax * 0.1, 0, 100),
    trauma: clamp(state.trauma, 0, 100),
    anxiety: clamp(state.anxiety - relax * 0.2, 0, 100),
    trustBaseline: clamp(state.trustBaseline + relax * 0.1, 0, 100)
  };
}

/** Краткое текстовое описание для промпта или отладки */
export function mentalStateSummary(s: MentalState): string {
  if (s.trauma > 70) return 'глубокая травма, настороженность';
  if (s.stress > 75) return 'сильный стресс, раздражительность';
  if (s.happiness < 25) return 'подавленность, мало радости';
  if (s.happiness > 70 && s.stress < 40) return 'спокойствие и удовлетворённость';
  return 'обычное напряжение быта';
}

/**
 * Угрозы, запугивание, газлайтинг в реплике игрока — долгосрочный след в психике NPC.
 * Вызывать при каждом обмене репликами (процедурный слой).
 */
export function coercivePlayerLineSeverity(playerLine: string, lang: Language): 'threat' | 'gaslight' | null {
  const t = playerLine.toLowerCase();
  if (lang === 'ru') {
    if (/угроз|убью|убьют|сломаю|заставлю|на колени|пожалеешь|расплач/.test(t)) return 'threat';
    if (/врёшь|врешь|сумасшедш|дура|ничтожеств|никто не любит|ты одна|ты один/.test(t)) return 'gaslight';
  } else {
    if (/threat|kill you|hurt you|make you|knees|pay for this|you'll regret/.test(t)) return 'threat';
    if (/liar|crazy|insane|worthless|nobody loves|you're alone|gaslight/.test(t)) return 'gaslight';
  }
  return null;
}

export function applyCoercivePlayerLine(npc: NPC, playerLine: string, lang: Language): void {
  const t = playerLine.toLowerCase();
  let stress = 0;
  let happiness = 0;
  let trauma = 0;

  if (lang === 'ru') {
    if (/угроз|убью|убьют|сломаю|заставлю|на колени|пожалеешь|расплач/.test(t)) stress += 8;
    if (/врёшь|врешь|сумасшедш|дура|ничтожеств|никто не любит|ты одна|ты один/.test(t)) {
      stress += 5;
      trauma += 4;
      happiness -= 6;
    }
  } else {
    if (/threat|kill you|hurt you|make you|knees|pay for this|you'll regret/.test(t)) stress += 8;
    if (/liar|crazy|insane|worthless|nobody loves|you're alone|gaslight/.test(t)) {
      stress += 5;
      trauma += 4;
      happiness -= 6;
    }
  }

  if (stress + trauma === 0) return;
  npc.mentalState = applyMentalEvent(npc.mentalState, {
    stressDelta: stress,
    happinessDelta: happiness,
    traumaDelta: trauma
  });
}
