/**
 * Рынок слухов: TTL и распространение по графу локаций (основной поток — без async для консистентного state).
 */
import type { ActiveRumor, Location, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n';
import type { NPCSystem } from '@/engine/NPCSystem';
import { factionTagsForGossipNpc } from '@/domain/social/gossipFactionTags';
import { decayAndSpreadRumors, activeRumorToDto, dtoToActiveRumor } from '@/engine/gossipSpreadPure';
import { pushWorldLog } from '@/engine/worldEvents';

export { factionTagsForGossipNpc };

export function buildLocationAdjacency(locations: Location[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const loc of locations) {
    adj[loc.id] = [...loc.connectedLocations];
  }
  return adj;
}

/** Один шаг: уменьшить TTL и расширить охват по смежным локациям. */
export function tickActiveRumorsSync(
  rumors: ActiveRumor[],
  hours: number,
  adjacency: Record<string, string[]>,
  randomFn?: () => number,
): ActiveRumor[] {
  if (rumors.length === 0) return [];
  return decayAndSpreadRumors(rumors.map(activeRumorToDto), hours, adjacency, randomFn).map(dtoToActiveRumor);
}

/** Порог по шкале импакта разговора (харизма/случайность), не по −100…100. */
const SOCIAL_RUMOR_IMPACT_STRONG = 2.35;

/**
 * Слух на рынке `activeRumors` после живого контакта с NPC: текст зависит от знака
 * «эффективного» импакта (как NPC пересказывает встречу).
 */
export function buildSocialGossipActiveRumor(input: {
  npcName: string;
  playerName: string;
  locationName: string;
  originLocationId: string;
  effectiveImpact: number;
  factionTags: string[];
  lang: Language;
}): ActiveRumor {
  const id = `rumor_social_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const neg = input.effectiveImpact < 0;
  const strong = Math.abs(input.effectiveImpact) > SOCIAL_RUMOR_IMPACT_STRONG;
  const { npcName, playerName, locationName, lang } = input;

  let message: string;
  if (lang === 'ru') {
    message = neg
      ? strong
        ? `${npcName} в гневе пересказывает встречу с ${playerName} в «${locationName}» — слушатели делают выводы не в вашу пользу.`
        : `${npcName} намекает соседям: с ${playerName} лучше не связываться — разговор в «${locationName}» оставил осадок.`
      : strong
        ? `${npcName} открыто хвалит ${playerName} после встречи в «${locationName}» — настроение вокруг мягче.`
        : `${npcName} говорит о ${playerName} с уважением после беседы в «${locationName}».`;
  } else {
    message = neg
      ? strong
        ? `${npcName} angrily recounts meeting ${playerName} in ${locationName}—listeners draw unkind conclusions.`
        : `${npcName} hints that ${playerName} is trouble—the talk in ${locationName} left a sour taste.`
      : strong
        ? `${npcName} speaks warmly of ${playerName} after a meeting in ${locationName}.`
        : `${npcName} mentions ${playerName} with respect after a chat in ${locationName}.`;
  }

  const ttlHours = 28 + Math.floor(Math.random() * 56);
  const severity = strong && neg ? 'dramatic' : neg ? 'rumor' : 'info';

  return {
    id,
    message,
    severity,
    ttlHours,
    originLocationId: input.originLocationId,
    factionTags: input.factionTags,
    reachedLocationIds: [input.originLocationId]
  };
}

/** Органический слух из текущей локации. */
export function maybeSpawnOrganicRumor(
  npcSystem: NPCSystem,
  locationId: string | undefined,
  rumors: ActiveRumor[],
  lang: Language
): void {
  if (!locationId || Math.random() > 0.085) return;
  const npcs = npcSystem.getNPCsInLocation(locationId).filter((n) => n.status === 'alive');
  if (npcs.length === 0) return;
  const n = npcs[Math.floor(Math.random() * npcs.length)];
  const fk = factionTagsForGossipNpc(n);

  rumors.push({
    id: `rumor_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    message:
      lang === 'ru'
        ? `Говорят, ${n.name} не всегда открыт о своих источниках дохода.`
        : `They say ${n.name} is cagey about where the coin flows.`,
    severity: 'rumor',
    ttlHours: 36 + Math.floor(Math.random() * 60),
    originLocationId: locationId,
    factionTags: fk,
    reachedLocationIds: [locationId]
  });
}

/** Редкая строка в журнале, если игрок в локации в зоне слуха. */
export function flushRumorJournalHighlights(
  rumors: ActiveRumor[],
  worldLog: WorldLogEntry[],
  lang: Language,
  playerLocationId: string | undefined
): void {
  if (!playerLocationId) return;
  const hits = rumors.filter((r) => r.reachedLocationIds.includes(playerLocationId));
  if (hits.length === 0 || Math.random() > 0.12) return;
  const r = hits[Math.floor(Math.random() * hits.length)];
  pushWorldLog(
    worldLog,
    lang === 'ru' ? `До вас доползает слух: ${r.message}` : `A rumor reaches you: ${r.message}`,
    r.severity ?? 'rumor',
    'social',
  );
}
