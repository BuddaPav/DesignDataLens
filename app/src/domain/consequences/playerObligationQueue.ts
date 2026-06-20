import type { Consequence, PlayerObligationPending } from '@/types/game';
import type { Language } from '@/i18n';

const MIN_DELAY_HOURS = 6;
const MAX_OBLIGATIONS = 24;
const MAX_PER_KIND = 4;

export type ObligationKind = PlayerObligationPending['kind'];

function obligationId(kind: ObligationKind, locationId: string, npcId: string | undefined, idx: number): string {
  let h = 2166136261;
  const base = `${kind}:${locationId}:${npcId ?? 'none'}:${idx}`;
  for (let i = 0; i < base.length; i += 1) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `obl_${(h >>> 0).toString(36)}`;
}

function normalizeDelay(raw: number): number {
  return Math.max(MIN_DELAY_HOURS, Math.floor(raw));
}

export function detectObligationKinds(line: string): ObligationKind[] {
  const n = line
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const kinds: ObligationKind[] = [];
  const has = (needles: string[]) => needles.some((x) => n.includes(x));

  if (has(['promise', 'obesh', 'обещ', 'klyanus', 'клянус', 'swear', 'give my word'])) {
    kinds.push('promise');
  }
  if (has(['betray', 'predal', 'предал', 'broke trust', 'broken oath', 'изменил'])) {
    kinds.push('betrayal');
  }
  if (has(['debt', 'dolg', 'должен', 'owe', 'задолж', 'долг'])) {
    kinds.push('debt');
  }
  return kinds;
}

export function enqueuePlayerObligations(
  queue: PlayerObligationPending[],
  kinds: ObligationKind[],
  locationId: string,
  npcId?: string,
  delayHours = 18,
): PlayerObligationPending[] {
  if (kinds.length === 0) return queue;
  const delay = normalizeDelay(delayHours);
  const next = [...queue];

  for (const kind of kinds) {
    const sameKind = next.filter((o) => o.kind === kind && o.locationId === locationId).length;
    if (sameKind >= MAX_PER_KIND) continue;
    const sig = `${kind}:${locationId}:${npcId ?? ''}`;
    if (next.some((o) => o.kind === kind && o.locationId === locationId && o.npcId === npcId)) {
      continue;
    }
    next.push({
      id: obligationId(kind, locationId, npcId, next.length),
      remainingHours: delay,
      kind,
      locationId,
      npcId,
      traceToken: sig,
    });
  }

  if (next.length <= MAX_OBLIGATIONS) return next;
  return next
    .sort((a, b) => a.remainingHours - b.remainingHours)
    .slice(0, MAX_OBLIGATIONS);
}

export function tickPlayerObligationQueue(
  queue: PlayerObligationPending[],
  elapsedHours: number,
  lang: Language,
): {
  queue: PlayerObligationPending[];
  released: Consequence[];
  logLines: string[];
} {
  const h = Math.max(0, Math.floor(elapsedHours));
  if (h <= 0 || queue.length === 0) {
    return { queue, released: [], logLines: [] };
  }

  const next: PlayerObligationPending[] = [];
  const released: Consequence[] = [];
  const logLines: string[] = [];

  for (const item of queue) {
    const remaining = item.remainingHours - h;
    if (remaining > 0) {
      next.push({ ...item, remainingHours: remaining });
      continue;
    }

    const questKey = `caravan_supply:${item.locationId}:aftermath_${item.kind}_${item.id}`;
    released.push({
      type: 'quest_unlock',
      key: questKey,
      value: 1,
    });

    if (item.kind === 'promise') {
      released.push({
        type: 'reputation_change',
        key: 'guild_merchants',
        value: 2,
      });
    } else if (item.kind === 'betrayal') {
      released.push({
        type: 'reputation_change',
        key: 'church_order',
        value: -3,
      });
      released.push({
        type: 'world_event',
        key: 'obligation_betrayal_echo',
        value: {
          message:
            lang === 'ru'
              ? 'Старый обман всплыл снова — доверие в округе просело.'
              : 'An old betrayal resurfaced — local trust has dropped.',
          locationReputationDelta: { [item.locationId]: -2 },
        },
      });
    } else {
      released.push({
        type: 'world_event',
        key: 'obligation_debt_echo',
        value: {
          message:
            lang === 'ru'
              ? 'Долг напомнил о себе: кто-то ждёт вашего ответа.'
              : 'A debt came due: someone expects your answer.',
        },
      });
    }

    logLines.push(
      lang === 'ru'
        ? `Последствие обещания (${item.kind}) сработало в «${item.locationId}».`
        : `A past obligation (${item.kind}) resolved near "${item.locationId}".`,
    );
  }

  return { queue: next, released, logLines };
}
