import type { Consequence } from '@/types/game';
import type { Language } from '@/i18n';
import type { DialogueFollowupTag } from '@/domain/consequences/generateDialogueFollowupQuest';

type DialogueConsequenceInput = {
  line: string;
  npcId: string;
  locationId: string;
  lang: Language;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
}

function hasAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function seededId(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function deriveDialogueConsequences({
  line,
  npcId,
  locationId,
  lang,
}: DialogueConsequenceInput): Consequence[] {
  const n = normalize(line).trim();
  if (n.length < 6) return [];

  const consequences: Consequence[] = [];

  const polite = hasAny(n, ['please', 'thank', 'spasib', 'pozhalu', 'пожал', 'спасибо', 'уважа']);
  const threat = hasAny(n, ['убью', 'kill', 'threat', 'угрож', 'сломаю', 'burn', 'destroy']);
  const help = hasAny(n, ['help', 'assist', 'помог', 'выруч', 'поддерж']);
  const crime = hasAny(n, ['steal', 'rob', 'thief', 'вор', 'украд', 'граб', 'blackmail', 'шантаж']);
  const trade = hasAny(n, ['trade', 'deal', 'market', 'торг', 'сделк', 'контракт', 'караван']);
  const faith = hasAny(n, ['church', 'order', 'faith', 'храм', 'церк', 'орден', 'вера']);
  const science = hasAny(n, ['academy', 'research', 'study', 'учен', 'академ', 'исслед']);

  if (polite) {
    consequences.push({
      type: 'npc_relationship',
      key: npcId,
      value: { trust: 2, affection: 1, respect: 1 },
    });
  }

  if (help) {
    consequences.push({
      type: 'npc_relationship',
      key: npcId,
      value: { trust: 3, respect: 2 },
    });
    consequences.push({
      type: 'world_event',
      key: 'dialogue_consequence_help',
      value: {
        message:
          lang === 'ru'
            ? 'Разговор о помощи разошелся слухом: люди внимательнее присматриваются к вашим поступкам.'
            : 'Your talk about helping others spreads: people start watching your actions more closely.',
        locationReputationDelta: { [locationId]: 1 },
      },
    });
    consequences.push({
      type: 'reputation_change',
      key: 'guild_merchants',
      value: 1,
      delay: 18,
    });
  }

  if (threat) {
    consequences.push({
      type: 'npc_relationship',
      key: npcId,
      value: { trust: -6, affection: -4, fear: 8 },
    });
    consequences.push({
      type: 'world_event',
      key: 'dialogue_consequence_threat',
      value: {
        message:
          lang === 'ru'
            ? 'Жесткая реплика усилила напряжение в округе.'
            : 'Your harsh words increase local tension.',
        locationReputationDelta: { [locationId]: -2 },
      },
    });
    consequences.push({
      type: 'reputation_change',
      key: 'church_order',
      value: -2,
      delay: 12,
    });
  }

  if (trade) {
    consequences.push({
      type: 'reputation_change',
      key: 'guild_merchants',
      value: 2,
    });
  }

  if (crime) {
    consequences.push({
      type: 'reputation_change',
      key: 'thieves_guild',
      value: 3,
    });
    consequences.push({
      type: 'reputation_change',
      key: 'church_order',
      value: -2,
    });
    consequences.push({
      type: 'story_flag',
      key: 'player_alignment:criminal_intent',
      value: true,
      hidden: true,
    });
    consequences.push({
      type: 'world_event',
      key: 'dialogue_consequence_crime_heat',
      value: {
        message:
          lang === 'ru'
            ? 'Слух о ваших намерениях дошел до патрулей; контроль на дорогах усиливается.'
            : 'Word of your intent reaches patrols; road checks become tighter.',
      },
      delay: 20,
    });
  }

  if (faith) {
    consequences.push({
      type: 'reputation_change',
      key: 'church_order',
      value: 2,
    });
  }

  if (science) {
    consequences.push({
      type: 'reputation_change',
      key: 'academy',
      value: 2,
    });
  }

  if (help || trade || faith || science) {
    const id = seededId(`${locationId}:${n}`);
    const tags: DialogueFollowupTag[] = [];
    if (help) tags.push('help');
    if (trade) tags.push('trade');
    if (faith) tags.push('faith');
    if (science) tags.push('science');
    consequences.push({
      type: 'quest_unlock',
      key: `dialogue_followup:${locationId}:${id}`,
      value: { npcId, tags },
    });
  }

  return consequences.slice(0, 8);
}
