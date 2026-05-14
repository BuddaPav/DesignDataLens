// Shop Panel — золото + множитель рынка (caravan supply); IAP USD показан как справка.

import { ShoppingBag, Sparkles, Crown, Gem, User, Coins, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ShopItem } from '@/types/game';
import { resolveShopGoldPrice } from '@/domain/economy/shopPurchase';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';

interface ShopPanelProps {
  items: ShopItem[];
  gold: number;
  locationId: string;
  factionPowers: Map<string, number> | undefined;
  onPurchase: (itemId: string) => void;
}

export function ShopPanel({ items, gold, locationId, factionPowers, onPurchase }: ShopPanelProps) {
  const lang = useLanguage();

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'story_pass':
        return BookOpen;
      case 'character_slot':
        return User;
      case 'cosmetic':
        return Sparkles;
      case 'token':
        return Gem;
      case 'premium':
        return Crown;
      default:
        return ShoppingBag;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-xl border border-violet-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">{t('game.shop.support_title', lang)}</h3>
        </div>
        <p className="text-sm text-slate-400">{t('game.shop.support_desc', lang)}</p>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-slate-400">{t('game.shop.your_gold', lang)}</span>
        </div>
        <span className="font-mono text-lg text-amber-400">{gold}</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = getItemIcon(item.type);
          const goldPrice = resolveShopGoldPrice(item.goldPriceBase, locationId, factionPowers);
          const canAfford = gold >= goldPrice;

          return (
            <div
              key={item.id}
              className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    {item.limited && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        Limited
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.rewards.map((reward, i) => (
                      <span key={i} className="text-xs bg-slate-800 px-2 py-0.5 rounded">
                        {reward.value} {reward.key.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-amber-400 tabular-nums">
                        {goldPrice} {t('game.shop.gold_abbr', lang)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t('game.shop.usd_ref', lang).replace('{{usd}}', String(item.priceUSD))}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
                      onClick={() => onPurchase(item.id)}
                    >
                      {t('game.shop.buy_gold', lang)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 text-center">{t('game.shop.ethics', lang)}</p>
    </div>
  );
}
