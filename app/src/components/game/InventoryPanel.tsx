// Inventory Panel

import { Coins, Package, Sword, Shield, Heart, Trash2, Hand } from 'lucide-react';
import type { Inventory, Item, PlayerStats } from '@/types/game';

import type { Language } from '@/i18n/index';
import { labelsForTemplateItem } from '@/domain/inventory/itemCatalog';
import { useLanguage } from '@/i18n/LanguageProvider';

interface InventoryPanelProps {
  inventory: Inventory;
  stats: PlayerStats;
  /** Quick drop action - remove item from inventory */
  onDropItem?: (itemId: string) => void;
  /** Quick offer to nearby NPC */
  onOfferToNpc?: (itemId: string) => void;
}

function displayItemLines(item: Item, lang: Language) {
  const tpl = labelsForTemplateItem(item.id, lang);
  if (tpl) return { name: tpl.name, description: tpl.description };
  return { name: item.name, description: item.description };
}

export function InventoryPanel({ inventory, stats, onDropItem, onOfferToNpc }: InventoryPanelProps) {
  const lang = useLanguage();
  const equippedItems = inventory.items.filter(i => i.equipped);
  const unequippedItems = inventory.items.filter(i => !i.equipped);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'weapon': return Sword;
      case 'armor': return Shield;
      case 'consumable': return Heart;
      default: return Package;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-slate-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Gold */}
      <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-slate-400">Gold</span>
        </div>
        <span className="font-mono text-lg text-amber-400">{inventory.gold}</span>
      </div>

      {/* Equipped */}
      {equippedItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Equipped
          </h3>
          <div className="space-y-2">
            {equippedItems.map((item) => {
              const Icon = getItemIcon(item.type);
              const lines = displayItemLines(item, lang);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg"
                >
                  <Icon className={`w-5 h-5 ${getRarityColor(item.rarity)}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${getRarityColor(item.rarity)}`}>
                      {lines.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{lines.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Items ({inventory.items.length}/{inventory.maxSlots})
        </h3>
        
        {unequippedItems.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Your pack is empty</p>
          </div>
        ) : (
          <div className="max-h-[min(380px,45vh)] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {unequippedItems.map((item) => {
              const Icon = getItemIcon(item.type);
              const lines = displayItemLines(item, lang);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg group"
                >
                  <Icon className={`w-5 h-5 ${getRarityColor(item.rarity)}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${getRarityColor(item.rarity)}`}>
                      {lines.name}
                      {item.quantity > 1 && (
                        <span className="text-slate-500 ml-1">x{item.quantity}</span>
                      )}
                    </p>
                  </div>
                  {(onDropItem || onOfferToNpc) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onOfferToNpc && (
                        <button
                          onClick={() => onOfferToNpc(item.id)}
                          className="p-1.5 hover:bg-emerald-600/30 rounded text-emerald-400"
                          title="Offer to NPC"
                        >
                          <Hand className="w-4 h-4" />
                        </button>
                      )}
                      {onDropItem && (
                        <button
                          onClick={() => onDropItem(item.id)}
                          className="p-1.5 hover:bg-red-600/30 rounded text-red-400"
                          title="Drop item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Combat Stats
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Battles Won</span>
            <span className="text-green-400">{stats.battlesWon}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Battles Lost</span>
            <span className="text-red-400">{stats.battlesLost}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Enemies Defeated</span>
            <span className="text-violet-400">{stats.enemiesDefeated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
