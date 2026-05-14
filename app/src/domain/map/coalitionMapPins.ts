import type { EnemyCoalition, NPC } from '@/types/game';
import { npcWorldTile, randomPointNearAnchor } from '@/engine/worldTiles';

export type CoalitionMapPin = {
  coalitionId: string;
  tileX: number;
  tileY: number;
  /** Имя лидера для тултипа */
  leaderLabel: string;
  memberCount: number;
};

/**
 * Якоря угроз коалиций для тактической карты (MVP 087 / частично 026).
 */
export function buildCoalitionMapPins(
  coalitions: EnemyCoalition[] | undefined,
  npcs: NPC[],
): CoalitionMapPin[] {
  if (!coalitions?.length) return [];
  const byId = new Map(npcs.map((n) => [n.id, n]));
  const pins: CoalitionMapPin[] = [];

  for (const c of coalitions) {
    const leader = byId.get(c.leaderNpcId);
    let tileX: number;
    let tileY: number;
    if (leader) {
      const w = npcWorldTile(leader);
      tileX = w.x;
      tileY = w.y;
    } else {
      const p = randomPointNearAnchor(c.anchorLocationId, c.formedAt ^ 0x9e3779b9);
      tileX = Math.floor(p.tileX);
      tileY = Math.floor(p.tileY);
    }
    pins.push({
      coalitionId: c.id,
      tileX,
      tileY,
      leaderLabel: leader?.name ?? c.leaderNpcId,
      memberCount: c.memberNpcIds.length,
    });
  }

  return pins;
}
