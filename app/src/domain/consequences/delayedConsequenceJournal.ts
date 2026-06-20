import type { DelayedConsequencePending } from '@/types/game';
import type { Language } from '@/i18n';
import { t } from '@/i18n';
import { getStoryLocationById } from '@/domain/world/storyLocations';
import { getLocationAnchor } from '@/engine/worldTiles';
import { formatStoryReputationChoiceLogLine } from '@/domain/social/factionReputationRules';

export const MAX_DELAYED_LOG_LINES = 6;
export const MAX_DELAYED_ENQUEUE_LOG_LINES = 3;

type JournalMode = 'release' | 'enqueue';

function locationLabel(locationId: string, lang: Language): string {
  const storyLoc = getStoryLocationById(locationId);
  if (storyLoc?.name) return storyLoc.name;
  const anchor = getLocationAnchor(locationId);
  if (lang === 'ru') return anchor.labelRu;
  if (/^[\x20-\x7E]+$/.test(anchor.labelRu)) return anchor.labelRu;
  return locationId.replace(/_/g, ' ');
}

function sourceLabel(source: DelayedConsequencePending['source'], lang: Language): string {
  const key = `game.delayed.source.${source}` as Parameters<typeof t>[0];
  return t(key, lang);
}

function prefixLine(body: string, p: DelayedConsequencePending, lang: Language, mode: JournalMode): string {
  const loc = locationLabel(p.locationId, lang);
  const src = sourceLabel(p.source, lang);
  if (mode === 'enqueue') {
    return t('game.delayed.enqueue_whisper', lang)
      .replace('{{body}}', body)
      .replace('{{loc}}', loc)
      .replace('{{source}}', src)
      .replace('{{hours}}', String(p.remainingHours));
  }
  return t('game.delayed.release_prefix', lang)
    .replace('{{body}}', body)
    .replace('{{loc}}', loc)
    .replace('{{source}}', src);
}

function consequenceBody(p: DelayedConsequencePending, lang: Language): string | null {
  const c = p.consequence;
  if (c.type === 'reputation_change') {
    const delta = typeof c.value === 'number' ? c.value : Number(c.value);
    const line = formatStoryReputationChoiceLogLine(c.key, delta, lang);
    if (line) return line;
    if (!Number.isFinite(delta)) return null;
    const rounded = Math.abs(delta) >= 1 ? Math.round(delta) : Math.round(delta * 10) / 10;
    const deltaStr = rounded > 0 ? `+${rounded}` : `${rounded}`;
    return lang === 'ru'
      ? `Репутация «${c.key}» (${deltaStr})`
      : `Reputation «${c.key}» (${deltaStr})`;
  }
  if (c.type === 'world_event') {
    const v = c.value;
    if (v && typeof v === 'object' && 'message' in v && typeof (v as { message: unknown }).message === 'string') {
      return (v as { message: string }).message;
    }
    return lang === 'ru' ? 'Событие мира отложено' : 'A delayed world event ripples outward';
  }
  if (c.type === 'gold') {
    const amount = typeof c.value === 'number' ? c.value : Number(c.value);
    if (!Number.isFinite(amount)) return null;
    const sign = amount >= 0 ? '+' : '';
    return lang === 'ru' ? `Золото ${sign}${amount}` : `Gold ${sign}${amount}`;
  }
  if (c.type === 'npc_relationship') {
    const delta = typeof c.value === 'number' ? c.value : Number(c.value);
    if (!Number.isFinite(delta)) return null;
    const sign = delta >= 0 ? '+' : '';
    return lang === 'ru'
      ? `Отношения с ${c.key} (${sign}${delta})`
      : `Bond with ${c.key} (${sign}${delta})`;
  }
  return null;
}

export function formatDelayedConsequenceLine(
  p: DelayedConsequencePending,
  lang: Language,
  mode: JournalMode,
): string | null {
  const body = consequenceBody(p, lang);
  if (!body) return null;
  return prefixLine(body, p, lang, mode);
}

export function collectDelayedConsequenceLogLines(
  items: DelayedConsequencePending[],
  lang: Language,
  mode: JournalMode,
  maxLines = mode === 'enqueue' ? MAX_DELAYED_ENQUEUE_LOG_LINES : MAX_DELAYED_LOG_LINES,
): string[] {
  const out: string[] = [];
  for (const p of items) {
    if (out.length >= maxLines) break;
    const line = formatDelayedConsequenceLine(p, lang, mode);
    if (line) out.push(line);
  }
  return out;
}
