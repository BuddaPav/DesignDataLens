/**
 * Процедурные случайные события на дороге между локациями.
 * Редкость зависит от биома (тип локации).
 */
export type RoadEventRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface RoadEvent {
  id: string;
  /** Локализованное название */
  title: { ru: string; en: string };
  /** Описание последствий */
  description: { ru: string; en: string };
  /** Редкость события */
  rarity: RoadEventRarity;
  /**适用的biomes，如果为空则所有 biome都适用 */
  applicableBiomes?: string[];
  /** Влияние на HP игрока (отрицательное = урон) */
  hpChange?: number;
  /** Влияние на золото */
  goldChange?: number;
  /** ID квеста для启动 */
  triggersQuestId?: string;
  /** Теги для последствий */
  consequenceTags?: string[];
}

const COMMON_BIOMES = ['village', 'town', 'road', 'crossroads'];
const FOREST_BIOMES = ['forest', 'deep_forest', 'grove'];
const MOUNTAIN_BIOMES = ['mountain', 'cave', 'pass'];
const SWAMP_BIOMES = ['swamp', 'marsh'];
const DESERT_BIOMES = ['desert', 'oasis'];

export const ROAD_EVENTS: RoadEvent[] = [
  // Common events
  {
    id: 'event_traveler_meeting',
    title: { ru: 'Странник', en: 'Traveler' },
    description: { ru: 'Встретили путника, который поделился новостями', en: 'Met a traveler who shared news' },
    rarity: 'common',
    applicableBiomes: [],
  },
  {
    id: 'event_robbing',
    title: { ru: 'Разбойники!', en: 'Bandits!' },
    description: { ru: 'На вас напали разбойники', en: 'Bandits attacked you' },
    rarity: 'uncommon',
    applicableBiomes: ['road', 'crossroads', 'forest'],
    hpChange: -15,
    goldChange: -20,
  },
  {
    id: 'event_finding_herbs',
    title: { ru: 'Ценные травы', en: 'Valuable herbs' },
    description: { ru: 'Нашли целебные растения', en: 'Found medicinal plants' },
    rarity: 'uncommon',
    applicableBiomes: [...FOREST_BIOMES, ...SWAMP_BIOMES],
    hpChange: 10,
    goldChange: 15,
  },
  {
    id: 'event_merchant_caravan',
    title: { ru: 'Караван торговцев', en: 'Merchant caravan' },
    description: { ru: 'Повстречали торговый караван', en: 'Met a merchant caravan' },
    rarity: 'common',
    applicableBiomes: [...COMMON_BIOMES, 'desert'],
    goldChange: 25,
  },
  {
    id: 'event_abandoned_camp',
    title: { ru: 'Покинутый лагерь', en: 'Abandoned camp' },
    description: { ru: 'Нашли лагерь с припасами', en: 'Found camp with supplies' },
    rarity: 'rare',
    applicableBiomes: [...FOREST_BIOMES, 'road'],
    hpChange: 5,
    goldChange: 10,
  },
  {
    id: 'event_storm',
    title: { ru: 'Буря', en: 'Storm' },
    description: { ru: 'Буря застигла в пути', en: 'Storm caught you on the road' },
    rarity: 'uncommon',
    applicableBiomes: ['mountain', 'pass', 'hill'],
    hpChange: -10,
  },
  {
    id: 'event_ancient_ruins',
    title: { ru: 'Древние руины', en: 'Ancient ruins' },
    description: { ru: 'Нашли древнее святилище', en: 'Found an ancient shrine' },
    rarity: 'epic',
    applicableBiomes: [...FOREST_BIOMES, ...MOUNTAIN_BIOMES],
    goldChange: 50,
    triggersQuestId: 'quest_ancient_ruins',
  },
  {
    id: 'event_healing_spring',
    title: { ru: 'Целебный источник', en: 'Healing spring' },
    description: { ru: 'Нашли целебный источник', en: 'Found a healing spring' },
    rarity: 'rare',
    applicableBiomes: [...FOREST_BIOMES, 'grove'],
    hpChange: 25,
  },
];

const RARITY_CHANCE: Record<RoadEventRarity, number> = {
  common: 0.15,
  uncommon: 0.08,
  rare: 0.03,
  epic: 0.01,
};

/** Получить RARITY_THRESHOLD для биома */
export function getRarityChanceForBiome(biome: string | undefined): number {
  if (!biome) return RARITY_CHANCE.common;
  if (DESERT_BIOMES.includes(biome)) return RARITY_CHANCE.common + 0.02;
  if (MOUNTAIN_BIOMES.includes(biome)) return RARITY_CHANCE.rare;
  return RARITY_CHANCE.common;
}

/** Проверить, произойдет ли событие при перемещении */
export function shouldTriggerRoadEvent(seed: number, fromBiome: string | undefined, toBiome: string | undefined): boolean {
  const chance = getRarityChanceForBiome(fromBiome ?? toBiome);
  const roll = (seed % 1000) / 1000;
  return roll < chance;
}

/** Получить случайное событие для биома */
export function getRandomRoadEvent(seed: number, biome: string | undefined): RoadEvent | null {
  const applicable = ROAD_EVENTS.filter(e => {
    if (!e.applicableBiomes?.length) return true;
    return e.applicableBiomes.includes(biome ?? '');
  });
  if (!applicable.length) return null;

  // Weighted random by rarity
  const weights: Record<RoadEventRarity, number> = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 5,
  };
  const totalWeight = applicable.reduce((sum, e) => sum + weights[e.rarity], 0);
  const biomeLen = (biome?.length) ?? 0;
  let roll = ((seed + biomeLen) % 1000) / 1000 * totalWeight;

  for (const event of applicable) {
    roll -= weights[event.rarity];
    if (roll <= 0) return event;
  }
  return applicable[0];
}

/** Применить последствия события к игроку (返回 обновленные статы) */
export function applyRoadEventConsequences(
  player: { character: { hp: number; maxHp: number; gold: number } },
  event: RoadEvent
): { hp: number; gold: number } {
  const maxHp = player.character.maxHp;
  let hp = player.character.hp;
  let gold = player.character.gold;
  if (event.hpChange) {
    hp = Math.max(0, Math.min(maxHp, hp + event.hpChange));
  }
  if (event.goldChange) {
    gold = Math.max(0, gold + event.goldChange);
  }
  return { hp, gold };
}