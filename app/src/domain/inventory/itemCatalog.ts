/**
 * Каталог шаблонных предметов (ключ сцен → тип, редкость, i18n).
 * Неизвестные ключи сводятся к эвристике в inventoryRules (имя из ключа).
 */
import type { Item } from '@/types/game';
import type { Language } from '@/i18n/index';
import { t } from '@/i18n/index';

import { clampStackQuantity } from '@/domain/inventory/constants';

type ItemI18nKey = Parameters<typeof t>[0];

export type ItemTemplateDefinition = {
  type: Item['type'];
  rarity: Item['rarity'];
  nameKey: ItemI18nKey;
  descKey: ItemI18nKey;
};

/** Известные ключи из сцен и тестов; расширять по мере контента. */
export const ITEM_TEMPLATE_CATALOG: Record<string, ItemTemplateDefinition> = {
  herb: {
    type: 'consumable',
    rarity: 'common',
    nameKey: 'item.tpl.herb.name',
    descKey: 'item.tpl.herb.desc',
  },
  coin_pouch: {
    type: 'material',
    rarity: 'uncommon',
    nameKey: 'item.tpl.coin_pouch.name',
    descKey: 'item.tpl.coin_pouch.desc',
  },
  ancient_scroll: {
    type: 'key',
    rarity: 'rare',
    nameKey: 'item.tpl.ancient_scroll.name',
    descKey: 'item.tpl.ancient_scroll.desc',
  },
  iron_ore: {
    type: 'material',
    rarity: 'common',
    nameKey: 'item.tpl.iron_ore.name',
    descKey: 'item.tpl.iron_ore.desc',
  },
  healing_salve: {
    type: 'consumable',
    rarity: 'uncommon',
    nameKey: 'item.tpl.healing_salve.name',
    descKey: 'item.tpl.healing_salve.desc',
  },
  steel_shard: {
    type: 'material',
    rarity: 'common',
    nameKey: 'item.tpl.steel_shard.name',
    descKey: 'item.tpl.steel_shard.desc',
  },
  mana_ember: {
    type: 'material',
    rarity: 'rare',
    nameKey: 'item.tpl.mana_ember.name',
    descKey: 'item.tpl.mana_ember.desc',
  },
  sealed_letter: {
    type: 'key',
    rarity: 'uncommon',
    nameKey: 'item.tpl.sealed_letter.name',
    descKey: 'item.tpl.sealed_letter.desc',
  },
  wild_mushroom: {
    type: 'consumable',
    rarity: 'common',
    nameKey: 'item.tpl.wild_mushroom.name',
    descKey: 'item.tpl.wild_mushroom.desc',
  },
  silver_wire: {
    type: 'material',
    rarity: 'uncommon',
    nameKey: 'item.tpl.silver_wire.name',
    descKey: 'item.tpl.silver_wire.desc',
  },
  rune_chip: {
    type: 'material',
    rarity: 'rare',
    nameKey: 'item.tpl.rune_chip.name',
    descKey: 'item.tpl.rune_chip.desc',
  },
  dragon_scale: {
    type: 'material',
    rarity: 'legendary',
    nameKey: 'item.tpl.dragon_scale.name',
    descKey: 'item.tpl.dragon_scale.desc',
  },
  nightshade: {
    type: 'consumable',
    rarity: 'rare',
    nameKey: 'item.tpl.nightshade.name',
    descKey: 'item.tpl.nightshade.desc',
  },
  cartographers_quill: {
    type: 'cosmetic',
    rarity: 'uncommon',
    nameKey: 'item.tpl.cartographers_quill.name',
    descKey: 'item.tpl.cartographers_quill.desc',
  },
  dried_rations: {
    type: 'consumable',
    rarity: 'common',
    nameKey: 'item.tpl.dried_rations.name',
    descKey: 'item.tpl.dried_rations.desc',
  },
  torch_bundle: {
    type: 'material',
    rarity: 'common',
    nameKey: 'item.tpl.torch_bundle.name',
    descKey: 'item.tpl.torch_bundle.desc',
  },
  spice_sachet: {
    type: 'material',
    rarity: 'uncommon',
    nameKey: 'item.tpl.spice_sachet.name',
    descKey: 'item.tpl.spice_sachet.desc',
  },
  silk_roll: {
    type: 'material',
    rarity: 'rare',
    nameKey: 'item.tpl.silk_roll.name',
    descKey: 'item.tpl.silk_roll.desc',
  },
  crystal_dust: {
    type: 'material',
    rarity: 'rare',
    nameKey: 'item.tpl.crystal_dust.name',
    descKey: 'item.tpl.crystal_dust.desc',
  },
  relic_shard: {
    type: 'key',
    rarity: 'rare',
    nameKey: 'item.tpl.relic_shard.name',
    descKey: 'item.tpl.relic_shard.desc',
  },
  obsidian_fragment: {
    type: 'material',
    rarity: 'uncommon',
    nameKey: 'item.tpl.obsidian_fragment.name',
    descKey: 'item.tpl.obsidian_fragment.desc',
  },
  ink_vial: {
    type: 'material',
    rarity: 'common',
    nameKey: 'item.tpl.ink_vial.name',
    descKey: 'item.tpl.ink_vial.desc',
  },
  leather_strip: {
    type: 'material',
    rarity: 'common',
    nameKey: 'item.tpl.leather_strip.name',
    descKey: 'item.tpl.leather_strip.desc',
  },
  travel_biscuits: {
    type: 'consumable',
    rarity: 'common',
    nameKey: 'item.tpl.travel_biscuits.name',
    descKey: 'item.tpl.travel_biscuits.desc',
  },
  guild_badge: {
    type: 'key',
    rarity: 'uncommon',
    nameKey: 'item.tpl.guild_badge.name',
    descKey: 'item.tpl.guild_badge.desc',
  },
  composure_tonic: {
    type: 'consumable',
    rarity: 'uncommon',
    nameKey: 'item.tpl.composure_tonic.name',
    descKey: 'item.tpl.composure_tonic.desc',
  },
};

export function templateKeyFromRowId(itemId: string): string | null {
  if (!itemId.startsWith('tpl:')) return null;
  const key = itemId.slice('tpl:'.length).trim();
  return key.length > 0 ? key : null;
}

export function getItemTemplateDefinition(templateKey: string): ItemTemplateDefinition | undefined {
  const k = templateKey.trim();
  return k ? ITEM_TEMPLATE_CATALOG[k] : undefined;
}

/** Локализованные подписи для строки инвентаря с id `tpl:*`, если ключ есть в каталоге. */
export function labelsForTemplateItem(itemId: string, lang: Language): { name: string; description: string } | null {
  const tk = templateKeyFromRowId(itemId);
  if (!tk) return null;
  const def = getItemTemplateDefinition(tk);
  if (!def) return null;
  return {
    name: t(def.nameKey, lang),
    description: t(def.descKey, lang),
  };
}

function displayNameFromTemplateKey(templateKey: string): string {
  const tKey = templateKey.trim();
  if (!tKey) return 'Item';
  if (tKey.includes(' ')) return tKey;
  return tKey
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Сборка строки предмета для последствий сцен и стека по шаблону. */
export function buildItemRowFromTemplate(templateKey: string, quantity: number, lang: Language): Item {
  const qty = clampStackQuantity(quantity);
  const id = `tpl:${templateKey.trim()}`;
  const def = getItemTemplateDefinition(templateKey);

  if (def) {
    return {
      id,
      name: t(def.nameKey, lang),
      description: t(def.descKey, lang),
      type: def.type,
      rarity: def.rarity,
      quantity: qty,
    };
  }

  return {
    id,
    name: displayNameFromTemplateKey(templateKey),
    description: '',
    type: 'consumable',
    rarity: 'common',
    quantity: qty,
  };
}
