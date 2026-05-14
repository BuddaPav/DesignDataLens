// Chronos — события и сплетни: распространение фактов между NPC с искажением у лжецов и потерей confidence.

import type { KnowledgeFact, NPC, WorldLogEntry, WorldLogTopic } from '@/types/game';
import { getLanguage } from '@/i18n';

function newLogId(): string {
  return `we_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

/** Добавить запись в журнал мира (мутирует массив) */
export function pushWorldLog(
  log: WorldLogEntry[],
  message: string,
  severity: WorldLogEntry['severity'] = 'info',
  topic?: WorldLogTopic,
): WorldLogEntry[] {
  log.push({
    id: newLogId(),
    timestamp: Date.now(),
    message,
    severity,
    ...(topic ? { topic } : {}),
  });
  if (log.length > 80) log.splice(0, log.length - 80);
  return log;
}

/** Низкая честность (обратно к agreeableness) — склонность кривить факты при передаче */
function dishonestyScore(npc: NPC): number {
  const a = npc.personality.agreeableness;
  const g = npc.personality.greed / 100;
  return Math.max(0, Math.min(1, (1 - a) * 0.55 + g * 0.35));
}

/** Исказить текст факта (простая эвристика для офлайн-симуляции) */
function distortFact(text: string, lang: 'ru' | 'en'): string {
  if (lang === 'ru') {
    if (text.includes('не ') || text.includes('нет ')) return text.replace(/не /g, '').replace(/нет /g, '');
    return `Говорят, на самом деле всё наоборот: ${text}`;
  }
  return `They say it's actually the opposite: ${text}`;
}

/**
 * Передать один факт от говорящего к слушателю (сплетня / обучение).
 * confidence уменьшается ×0.8; лживые NPC могут инвертировать смысл.
 */
export function transferKnowledgeFact(speaker: NPC, listener: NPC, fact: KnowledgeFact): void {
  if (!listener.knowledgeBase) return;
  const lang = getLanguage() === 'ru' ? 'ru' : 'en';
  let text = fact.text;
  let conf = fact.confidence * 0.8;
  if (dishonestyScore(speaker) > 0.55 && Math.random() < dishonestyScore(speaker)) {
    text = distortFact(text, lang);
    conf *= 0.7;
  }
  const copy: KnowledgeFact = {
    id: `kf_${Date.now()}_${listener.id}_${Math.floor(Math.random() * 1000)}`,
    text,
    confidence: Math.min(1, conf),
    sourceNpcId: speaker.id
  };
  listener.knowledgeBase.facts.push(copy);
  if (listener.knowledgeBase.facts.length > 120) {
    listener.knowledgeBase.facts = listener.knowledgeBase.facts.slice(-120);
  }
}

/**
 * После заметного разговора с игроком — шанс, что болтливый NPC передаст кусочек знаний другим в локации.
 */
export function spreadKnowledgeFromGossip(
  speaker: NPC,
  listeners: NPC[],
  impactAbs: number
): void {
  if (listeners.length === 0) return;
  const extravert = speaker.personality.extraversion;
  if (extravert < 0.45 || impactAbs < 0.25) return;
  const facts = speaker.knowledgeBase?.facts || [];
  if (facts.length === 0) return;
  const fact = facts[Math.floor(Math.random() * facts.length)];
  const maxTargets = extravert > 0.75 ? 3 : 1;
  const shuffled = [...listeners].sort(() => Math.random() - 0.5).slice(0, maxTargets);
  for (const L of shuffled) {
    if (L.id === speaker.id) continue;
    transferKnowledgeFact(speaker, L, fact);
  }
}
