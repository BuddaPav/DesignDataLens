// Социальная физика: действия игрока как события, свидетели, эмерджентные коалиции врагов.

import type { EnemyCoalition, NPC, NPCMemory, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n';
import { pushWorldLog } from '@/engine/worldEvents';

function newId(): string {
  return `coal_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

/** Игрок совершил заметный поступок — свидетели (NPC в той же локации) получают наблюдение в память. */
export function recordWitnessedPlayerAction(
  npcSystem: {
    getNPCsInLocation: (locId: string) => NPC[];
    addMemoryToNPC: (npcId: string, mem: NPCMemory) => void;
  },
  opts: {
    locationId: string;
    excludeNpcIds: Set<string>;
    summary: string;
    playerId: string;
    importance: number;
  }
): void {
  const witnesses = npcSystem
    .getNPCsInLocation(opts.locationId)
    .filter((n) => n.status === 'alive' && !opts.excludeNpcIds.has(n.id));
  for (const w of witnesses) {
    npcSystem.addMemoryToNPC(w.id, {
      id: `mem_w_${Date.now()}_${w.id}_${Math.floor(Math.random() * 999)}`,
      timestamp: Date.now(),
      type: 'observation',
      content: opts.summary,
      importance: Math.max(3, Math.min(10, opts.importance)),
      relatedEntities: [opts.playerId],
      emotionalValence: 0
    });
  }
}

function isEnemy(npc: NPC): boolean {
  return npc.playerRelationship.trust <= -80 || npc.playerRelationship.type === 'enemy';
}

function coalitionSignature(locId: string, ids: string[]): string {
  return `${locId}:${[...ids].sort().join(',')}`;
}

/**
 * Если в одной локации ≥2 врагов игрока — с шансом формируется коалиция с лидером (эмерджентный «узел» угрозы).
 */
export function tryEnemyCoalitionFormation(
  npcs: NPC[],
  existing: EnemyCoalition[] | undefined,
  worldLog: WorldLogEntry[],
  lang: Language
): EnemyCoalition[] {
  const prev = existing ?? [];
  const signatures = new Set(prev.map((c) => coalitionSignature(c.anchorLocationId, c.memberNpcIds)));

  const byLoc = new Map<string, NPC[]>();
  for (const n of npcs) {
    if (n.status !== 'alive' || !isEnemy(n)) continue;
    const list = byLoc.get(n.location) || [];
    list.push(n);
    byLoc.set(n.location, list);
  }

  const next = [...prev];

  for (const [locId, group] of byLoc) {
    if (group.length < 2) continue;
    const ids = group.map((g) => g.id).sort();
    const sig = coalitionSignature(locId, ids);
    if (signatures.has(sig)) continue;
    if (Math.random() > 0.35) continue;

    const leader = [...group].sort((a, b) => {
      const sa = a.personality.ambition + a.playerRelationship.fear * 0.4 + a.level * 1.5;
      const sb = b.personality.ambition + b.playerRelationship.fear * 0.4 + b.level * 1.5;
      return sb - sa;
    })[0];

    const coalition: EnemyCoalition = {
      id: newId(),
      formedAt: Date.now(),
      leaderNpcId: leader.id,
      memberNpcIds: group.map((g) => g.id),
      anchorLocationId: locId
    };
    next.push(coalition);
    signatures.add(sig);

    const names = group.map((g) => g.name).join(lang === 'ru' ? ', ' : ', ');
    pushWorldLog(
      worldLog,
      lang === 'ru'
        ? `${names} объединяют силы против вас. Лидер — ${leader.name}: вендетта обретает лицо.`
        : `${names} unite against you. ${leader.name} takes the lead—bad blood finds a banner.`,
      'dramatic',
      'social',
    );
  }

  if (next.length > 24) next.splice(0, next.length - 24);
  return next;
}
