/**
 * Торговые маршруты между сюжетными локациями — движение караванов и усиление охвата слухов.
 */
import type { ActiveRumor, TradeCaravan, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n';
import { pushWorldLog } from '@/engine/worldEvents';

export type TradeRouteDef = {
  id: string;
  /** Цикл локаций (последняя может совпадать с первой для замыкания). */
  locations: string[];
  /** Часы на один переход между соседними вершинами. */
  legHours: number;
};

export const CHRONOS_TRADE_ROUTES: TradeRouteDef[] = [
  {
    id: 'willbrook_ring',
    locations: ['starting_village', 'misty_crossroads', 'whispering_forest', 'old_ruins', 'starting_village'],
    legHours: 8
  },
  {
    id: 'ruins_forest_shuttle',
    locations: ['whispering_forest', 'old_ruins', 'whispering_forest'],
    legHours: 6
  },
  {
    id: 'crossroads_loop',
    locations: ['starting_village', 'misty_crossroads', 'whispering_forest', 'starting_village'],
    legHours: 7
  },
  {
    id: 'village_ruins_spine',
    locations: ['starting_village', 'old_ruins', 'whispering_forest', 'misty_crossroads', 'starting_village'],
    legHours: 9
  }
];

export function ensureDefaultCaravans(existing: TradeCaravan[] | undefined): TradeCaravan[] {
  const list = existing?.length ? [...existing] : [];
  const byRoute = new Set(list.map((c) => c.routeId));

  const ring = CHRONOS_TRADE_ROUTES.find((r) => r.id === 'willbrook_ring');
  if (ring && !byRoute.has('willbrook_ring')) {
    list.push({
      id: `caravan_${Date.now()}_ring`,
      routeId: 'willbrook_ring',
      atVertex: 0,
      hoursUntilNext: ring.legHours * 0.5,
    });
    byRoute.add('willbrook_ring');
  }

  const shuttle = CHRONOS_TRADE_ROUTES.find((r) => r.id === 'ruins_forest_shuttle');
  if (shuttle && !byRoute.has('ruins_forest_shuttle')) {
    list.push({
      id: `caravan_${Date.now()}_shuttle`,
      routeId: 'ruins_forest_shuttle',
      atVertex: 0,
      hoursUntilNext: shuttle.legHours * 0.35,
    });
  }

  const loop = CHRONOS_TRADE_ROUTES.find((r) => r.id === 'crossroads_loop');
  if (loop && !byRoute.has('crossroads_loop')) {
    list.push({
      id: `caravan_${Date.now()}_loop`,
      routeId: 'crossroads_loop',
      atVertex: 0,
      hoursUntilNext: loop.legHours * 0.6,
    });
  }

  const spine = CHRONOS_TRADE_ROUTES.find((r) => r.id === 'village_ruins_spine');
  if (spine && !byRoute.has('village_ruins_spine')) {
    list.push({
      id: `caravan_${Date.now()}_spine`,
      routeId: 'village_ruins_spine',
      atVertex: 0,
      hoursUntilNext: spine.legHours * 0.45,
    });
  }

  return list;
}

export function tickTradeCaravans(
  caravans: TradeCaravan[],
  routes: TradeRouteDef[],
  rumors: ActiveRumor[],
  hours: number,
  worldLog: WorldLogEntry[],
  lang: Language
): string[] {
  const h = Math.max(0, hours);
  const routeMap = new Map(routes.map((r) => [r.id, r]));
  const visited: string[] = [];

  for (const c of caravans) {
    const route = routeMap.get(c.routeId);
    if (!route || route.locations.length < 2) continue;

    c.hoursUntilNext -= h;
    while (c.hoursUntilNext <= 0) {
      c.atVertex = (c.atVertex + 1) % route.locations.length;
      const locId = route.locations[c.atVertex];
      c.hoursUntilNext += route.legHours;
      visited.push(locId);

      for (const rum of rumors) {
        if (!rum.reachedLocationIds.includes(locId)) {
          rum.reachedLocationIds.push(locId);
        }
      }

      if (Math.random() < 0.45) {
        pushWorldLog(
          worldLog,
          lang === 'ru'
            ? `Караван прибыл в точку мира (${locId}) — торговцы разносят новости и слухи.`
            : `A caravan reaches ${locId}—merchants carry gossip wide.`,
          'info',
          'economy',
        );
      }
    }
  }

  return visited;
}
