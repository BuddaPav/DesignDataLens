import type { Language } from '@/i18n';
import { t } from '@/i18n';
import type { Player, ShopItem, WorldLogEntry } from '@/types/game';
import { clampGold } from '@/domain/inventory/inventoryRules';
import { pushWorldLog } from '@/engine/worldEvents';
import { marketSupplyKeyForLocation, priceMultiplierFromMarketSupply } from '@/domain/economy/caravanEconomy';

export function resolveShopGoldPrice(
  goldPriceBase: number,
  locationId: string,
  factionPowers: Map<string, number> | undefined,
): number {
  if (!Number.isFinite(goldPriceBase) || goldPriceBase <= 0) return 0;
  const key = marketSupplyKeyForLocation(locationId);
  const supply = factionPowers?.get(key) ?? 0;
  const mult = priceMultiplierFromMarketSupply(supply);
  const rounded = Math.max(0, Math.round(goldPriceBase * mult));
  return Number.isFinite(rounded) ? rounded : 0;
}

export type ShopPurchaseFailReason = 'not_enough_gold' | 'unknown_item';

export type ShopPurchaseResult =
  | { ok: true; player: Player }
  | { ok: false; reason: ShopPurchaseFailReason };

function applyReward(player: Player, item: ShopItem, lang: Language, log: WorldLogEntry[]): Player {
  let p = player;
  for (const r of item.rewards) {
    switch (r.type) {
      case 'token':
      case 'story_tokens': {
        const add = typeof r.value === 'number' ? r.value : 0;
        const cur = p.inventory.storyTokens ?? 0;
        p = {
          ...p,
          inventory: { ...p.inventory, storyTokens: cur + add },
          storyProgress: { ...p.storyProgress, worldEventLog: log },
        };
        pushWorldLog(
          log,
          t('game.shop.reward_tokens', lang).replace('{{n}}', String(add)),
          'info',
          'economy',
        );
        break;
      }
      case 'story_unlock':
      case 'cosmetic':
      case 'character_slot':
      case 'premium_days':
        pushWorldLog(
          log,
          t('game.shop.reward_registered', lang).replace('{{item}}', item.name),
          'info',
          'economy',
        );
        break;
      default:
        break;
    }
  }
  return p;
}

export function purchaseShopItemWithGold(
  player: Player,
  item: ShopItem,
  locationId: string,
  lang: Language,
  log: WorldLogEntry[],
): ShopPurchaseResult {
  const price = resolveShopGoldPrice(
    item.goldPriceBase,
    locationId,
    player.storyProgress.worldState.factionPowers,
  );
  if (player.inventory.gold < price) {
    return { ok: false, reason: 'not_enough_gold' };
  }

  let next: Player = {
    ...player,
    inventory: {
      ...player.inventory,
      gold: clampGold(player.inventory.gold - price),
    },
    storyProgress: { ...player.storyProgress, worldEventLog: log },
  };

  pushWorldLog(
    log,
    t('game.shop.purchased_log', lang)
      .replace('{{item}}', item.name)
      .replace('{{gold}}', String(price)),
    'dramatic',
    'economy',
  );

  next = applyReward(next, item, lang, log);

  return { ok: true, player: next };
}
