// Chronos — процедурные реплики с опорой на память, характер, знания и психологию.
// Гибрид с WebLLM: при отсутствии модели или для фоновых NPC этот модуль — основной источник текста.

import type { GameTime, Location, NPC, Player, Weather, WorldEra } from '@/types/game';
import { findExpertForField } from '@/engine/knowledge';
import { applyCoercivePlayerLine, mentalStateSummary } from '@/engine/psychology';
import type { Language } from '@/i18n';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zа-яё0-9\s]/gi, ' ');
}

/** Оценка «знает ли NPC тему» по полю и ключам + тексту фактов */
function topicMatchesKnowledge(npc: NPC, message: string): boolean {
  const n = norm(message);
  const kb = npc.knowledgeBase;
  if (!kb) return false;
  if (n.includes(norm(kb.field)) || norm(kb.field).split(/\s+/).some((w) => w.length > 3 && n.includes(w))) return true;
  for (const key of kb.fieldKeys || []) {
    if (key.length > 2 && n.includes(norm(key))) return true;
  }
  for (const f of kb.facts || []) {
    const words = norm(f.text).split(/\s+/).filter((w) => w.length > 4);
    if (words.some((w) => n.includes(w))) return true;
  }
  return false;
}

function hourBucket(hour: number): string {
  if (hour >= 22 || hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'day';
  return 'evening';
}

/** Несколько воспоминаний с ротацией по времени — меньше ощущения «одной и той же» фразы. */
function formatRotatingMemories(npc: NPC, player: Player, lang: Language): string {
  const name = player.character.name;
  const pool = [...npc.memories].filter(
    (m) => m.relatedEntities?.includes(player.id) || m.content.toLowerCase().includes(name.toLowerCase())
  );
  if (pool.length === 0) return '';

  const tick = Math.floor(Date.now() / 120000);
  const start = tick % pool.length;
  const picks: typeof pool = [];
  for (let i = 0; i < Math.min(3, pool.length); i++) {
    picks.push(pool[(start + i) % pool.length]);
  }
  const uniq: typeof pool = [];
  const seen = new Set<string>();
  for (const m of picks) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    uniq.push(m);
  }
  const joined = uniq.map((m) => m.content).join(lang === 'ru' ? ' · ' : ' · ');
  return lang === 'ru' ? ` Помню о тебе: ${joined}.` : ` I remember: ${joined}.`;
}

/** Отказ от разговора: ночь, перегруз, вражда, психика. */
function evaluateConversationRefusal(npc: NPC, player: Player, playerMessage: string, ctx: DialogueContext): string | null {
  const lang = ctx.language;
  const rel = npc.playerRelationship;
  const trimmed = playerMessage.trim();
  if (trimmed.length < 4) return null;

  const windowMs = 48 * 60 * 1000;
  const now = Date.now();
  const recentConv = npc.memories.filter(
    (m) => m.timestamp > now - windowMs && (m.type === 'conversation' || m.type === 'manipulation')
  );
  if (recentConv.length >= 16) {
    return lang === 'ru'
      ? `${player.character.name}, хватит на сегодня — слишком много слов подряд. Отойди.`
      : `${player.character.name}, that's enough for today—too many words in a row. Step back.`;
  }

  const bucket = hourBucket(ctx.time.hour);
  if (bucket === 'night' && npc.schedule?.currentActivity === 'sleeping' && Math.random() < 0.55) {
    return lang === 'ru'
      ? 'Ночь. Я сплю. Если важно — приходи днём.'
      : "It's night. I'm asleep. If it matters, come back by day.";
  }

  if ((rel.type === 'enemy' || rel.trust <= -80) && trimmed.length > 90 && Math.random() < 0.4) {
    return lang === 'ru'
      ? 'Не размазывай. Скажи по делу — или исчезни.'
      : "Don't ramble. Say what you want—or vanish.";
  }

  if (npc.mentalState.stress > 90 && npc.personality.neuroticism > 0.52 && Math.random() < 0.38) {
    return lang === 'ru' ? 'Не сейчас. Я на пределе.' : "Not now. I'm at my limit.";
  }

  if (rel.trust < -40 && npc.mentalState.happiness < 28 && Math.random() < 0.28) {
    return lang === 'ru' ? 'Мне не до разговоров. Оставь меня.' : "I can't talk. Leave me.";
  }

  return null;
}

/** Шаблон «спроси обо всём сразу» из useGameState — не должен давать нелепый отказ «не моя тема». */
function isBroadExpertisePrompt(message: string, lang: Language): boolean {
  const n = norm(message);
  if (lang === 'ru') {
    if (n.includes('магия') && n.includes('алхимия') && n.includes('экспертиз')) return true;
    if (n.includes('магия') && n.includes('ковка') && n.includes('политика')) return true;
    return false;
  }
  if (n.includes('magic') && n.includes('alchemy') && n.includes('expertise')) return true;
  if (n.includes('magic') && n.includes('forging') && n.includes('politics')) return true;
  return false;
}

function eraIntro(lang: Language, era: WorldEra | undefined): string {
  if (lang !== 'ru') {
    if (era === 'future') return 'Out here on the frontier, ';
    if (era === 'modern') return 'In our time, ';
    return '';
  }
  if (era === 'future') return 'На периферии колоний ';
  if (era === 'modern') return 'В нашем веке ';
  return '';
}

function weatherBit(lang: Language, weather: Weather): string {
  if (lang === 'ru') {
    if (weather === 'stormy' || weather === 'rainy') return ' Дождь бьёт по крышам — говорите по существу.';
    if (weather === 'snowy') return ' Снег глушит звуки.';
    if (weather === 'foggy' || weather === 'mystical') return ' Туман путает силуэты.';
    if (weather === 'clear') return '';
    return '';
  }
  if (weather === 'stormy' || weather === 'rainy') return ' The weather is foul—keep it short.';
  if (weather === 'snowy') return ' Snow muffles everything.';
  if (weather === 'foggy' || weather === 'mystical') return ' Fog makes strangers of familiar faces.';
  return '';
}

export interface DialogueContext {
  location: Location;
  time: GameTime;
  weather: Weather;
  language: Language;
  /** Все NPC в локации — чтобы порекомендовать эксперта */
  npcsInLocation: NPC[];
  /** Эпоха мира — тон реплик */
  worldEra?: WorldEra;
}

/**
 * Ответ по теме знаний: если тема в зоне экспертизы — выдаём факты; иначе честный отказ + имя эксперта.
 */
export function generateKnowledgeResponse(
  npc: NPC,
  _topic: string,
  playerMessage: string,
  ctx: DialogueContext
): string {
  const lang = ctx.language;
  const kb = npc.knowledgeBase;
  const broad = isBroadExpertisePrompt(playerMessage, lang);
  const matches = topicMatchesKnowledge(npc, playerMessage);
  const locName = ctx.location.name;

  if (broad) {
    if (!kb?.facts?.length) {
      return lang === 'ru'
        ? `Я ${npc.profession}. В «${locName}» лучше скажите одно слово — что именно вас интересует.`
        : `I'm the ${npc.profession}. In ${locName}, name one thing you actually need.`;
    }
    const topFacts = [...kb.facts]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2)
      .map((f) => f.text);
    const lead = eraIntro(lang, ctx.worldEra);
    const w = weatherBit(lang, ctx.weather);
    if (lang === 'ru') {
      return `${lead}я ${npc.profession}, моя линия — ${kb.field.toLowerCase()}. Факты: ${topFacts.join(' ')}${w} Если нужно другое направление — скажите слово, я пошлю к нужному человеку.`;
    }
    return `${lead}I'm ${npc.profession}; my lane is ${kb.field}. Facts: ${topFacts.join(' ')}${w} If you need another field, say the word and I'll point you to the right person.`;
  }

  if (!matches) {
    const expert = findExpertForField(ctx.npcsInLocation, playerMessage, npc.id);
    if (expert && expert.id !== npc.id) {
      return lang === 'ru'
        ? `Это не моя специализация. Спросите ${expert.name} — ${expert.profession}; в «${locName}» по этой теме надёжнее именно ${expert.name}.`
        : `That's outside my expertise. Ask ${expert.name} (${expert.profession})—in ${locName}, that's their lane.`;
    }
    return lang === 'ru'
      ? `В «${locName}» я не берусь гадать по этой теме. Спросите конкретнее или у кого-то из местных.`
      : `In ${locName}, I won't guess on that. Ask someone local, or be more specific.`;
  }

  const topFacts = [...(kb.facts || [])]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2)
    .map((f) => f.text);

  if (lang === 'ru') {
    return `По ${kb.field.toLowerCase()} вот что важно: ${topFacts.join(' ')}`;
  }
  return `On ${kb.field}, here's what matters: ${topFacts.join(' ')}`;
}

/**
 * Полная синхронная реплика для разговора с NPC (без LLM): приветствие + знания или отказ + психология.
 */
export function buildNPCReplySync(npc: NPC, player: Player, playerMessage: string, ctx: DialogueContext): string {
  const lang = ctx.language;
  applyCoercivePlayerLine(npc, playerMessage, lang);

  const refusal = evaluateConversationRefusal(npc, player, playerMessage, ctx);
  if (refusal) return refusal;

  const rel = npc.playerRelationship;
  const name = player.character.name;
  const locName = ctx.location.name;
  const era = player.character.worldEra ?? ctx.worldEra;

  let greeting: string;
  if (rel.type === 'enemy' || rel.trust <= -80) {
    greeting = lang === 'ru' ? `${name}. Тебе лучше уйти из «${locName}».` : `${name}. You should leave ${locName}.`;
  } else if (rel.type === 'lover') {
    greeting =
      lang === 'ru'
        ? `${name}… наконец ты здесь, в «${locName}». Я так ждал(а) этого момента.`
        : `${name}... you're here, in ${locName}. I've been waiting for this.`;
  } else if (rel.type === 'close_friend') {
    greeting =
      lang === 'ru'
        ? `${name}, друг мой — хорошо, что ты в «${locName}». Если что — я рядом.`
        : `${name}, my friend—good you're in ${locName}. If you need anything, I'm here.`;
  } else if (rel.affection > 50) {
    greeting =
      lang === 'ru'
        ? `${name}, рад(а) видеть тебя здесь, в «${locName}».`
        : `${name}, good to see you here in ${locName}.`;
  } else if (rel.trust < -20) {
    greeting = lang === 'ru' ? `Опять ты в «${locName}». Что надо?` : `You again in ${locName}. What do you want?`;
  } else {
    greeting = lang === 'ru' ? `Приветствую, ${name}. Мы в «${locName}».` : `Greetings, ${name}. We're in ${locName}.`;
  }

  if (npc.mentalState.stress > 85 && rel.trust < 30) {
    greeting += lang === 'ru' ? ' Мне сейчас не до пустых разговоров.' : " I can't do small talk right now.";
  }

  const memoryBit = formatRotatingMemories(npc, player, lang);

  const bucket = hourBucket(ctx.time.hour);
  const timeNote =
    bucket === 'night' && npc.schedule?.currentActivity === 'sleeping'
      ? lang === 'ru'
        ? ' Поздно… я почти сплю.'
        : " It's late... I'm half asleep."
      : '';

  const psychNote =
    npc.mentalState.trauma > 65 && rel.trust > -40
      ? lang === 'ru'
        ? ` (${mentalStateSummary(npc.mentalState)})`
        : ` (${mentalStateSummary(npc.mentalState)})`
      : '';

  const knowledgePart =
    playerMessage.trim().length > 2
      ? ` ${generateKnowledgeResponse(npc, 'auto', playerMessage, ctx)}`
      : lang === 'ru'
        ? ` Я — ${npc.profession}. Скажи одно слово темы — отвечу по делу, без воды.`
        : ` I'm a ${npc.profession}. Give me one keyword and I'll answer plainly.`;

  const eraHint =
    era === 'future' && lang === 'ru'
      ? ' Хроника мира здесь тоньше обычного — не всё записано в сеть.'
      : era === 'future'
        ? ' The chronicle is thin out here—not everything is on the grid.'
        : '';

  return `${greeting}${memoryBit}${timeNote}${psychNote}${knowledgePart}${eraHint}`.trim();
}
