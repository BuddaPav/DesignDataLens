import { describe, expect, it } from 'vitest';
import type { Player, ShopItem } from '@/types/game';
import type { Language } from '@/i18n';
import { marketSupplyKeyForLocation } from '@/domain/economy/caravanEconomy';
import { resolveShopGoldPrice, purchaseShopItemWithGold } from '@/domain/economy/shopPurchase';

const lang: Language = 'en';

function minimalPlayer(invGold: number): Player {
  return {
    id: 'p',
    name: 'T',
    createdAt: 1,
    character: {} as Player['character'],
    stats: {} as Player['stats'],
    inventory: { gold: invGold, items: [], maxSlots: 20 },
    storyProgress: {
      currentChapter: 1,
      currentScene: 'intro',
      mainQuest: null,
      activeQuests: [],
      completedQuests: [],
      worldState: {
        time: { year: 1, month: 1, day: 1, hour: 12, minute: 0 },
        weather: 'clear',
        globalEvents: [],
        factionPowers: new Map<string, number>(),
      },
      discoveredLocations: [],
      metNPCs: [],
      unlockedLore: [],
      worldEventLog: [],
      worldPosition: { tileX: 0, tileY: 0 },
      enemyCoalitions: [],
      activeRumors: [],
      factionReputation: {
        guild_merchants: 0,
        church_order: 0,
        thieves_guild: 0,
        academy: 0,
      },
      tradeCaravans: [],
    },
    choices: [],
    archetype: 'storyteller',
    preferredTone: 'mysterious',
    emotionalHistory: [],
    lastSession: 1,
    totalPlayTime: 0,
    sessionCount: 1,
  } as Player;
}

describe('shopPurchase', () => {
  it('returns 0 for non-finite or non-positive base price', () => {
    expect(resolveShopGoldPrice(0, 'starting_village', new Map())).toBe(0);
    expect(resolveShopGoldPrice(-50, 'starting_village', new Map())).toBe(0);
    expect(resolveShopGoldPrice(Number.NaN, 'starting_village', new Map())).toBe(0);
    expect(resolveShopGoldPrice(Number.POSITIVE_INFINITY, 'starting_village', new Map())).toBe(0);
  });

  it('applies market supply multiplier to gold price (068)', () => {
    const loc = 'starting_village';
    const key = marketSupplyKeyForLocation(loc);
    const powers = new Map<string, number>([[key, 60]]);
    const basePrice = 100;
    const withSupply = resolveShopGoldPrice(basePrice, loc, powers);
    const baseline = resolveShopGoldPrice(basePrice, loc, new Map());
    expect(withSupply).not.toBe(baseline);
    expect(withSupply).toBeGreaterThan(0);
  });

  it('deducts gold and respects insufficient funds (066–067)', () => {
    const item: ShopItem = {
      id: 'tok',
      name: 'Tokens',
      description: '',
      type: 'token',
      priceUSD: 1,
      goldPriceBase: 500,
      rewards: [{ type: 'token', key: 'story_tokens', value: 5 }],
    };
    const rich = minimalPlayer(10_000);
    const log: import('@/types/game').WorldLogEntry[] = [];
    const ok = purchaseShopItemWithGold(rich, item, 'starting_village', lang, log);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.player.inventory.gold).toBeLessThan(10_000);

    const poor = minimalPlayer(10);
    const bad = purchaseShopItemWithGold(poor, item, 'starting_village', lang, []);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe('not_enough_gold');
  });

  it('accepts purchase when gold exactly equals computed price (037 edge)', () => {
    const item: ShopItem = {
      id: 'exact',
      name: 'X',
      description: '',
      type: 'token',
      priceUSD: 1,
      goldPriceBase: 100,
      rewards: [{ type: 'token', key: 'story_tokens', value: 1 }],
    };
    const loc = 'starting_village';
    const price = resolveShopGoldPrice(item.goldPriceBase, loc, new Map());
    const log: import('@/types/game').WorldLogEntry[] = [];
    const r = purchaseShopItemWithGold(minimalPlayer(price), item, loc, lang, log);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.player.inventory.gold).toBe(0);
      expect(Array.isArray(r.player.inventory.items)).toBe(true);
    }
  });
});
