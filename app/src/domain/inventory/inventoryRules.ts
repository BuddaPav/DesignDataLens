/**
 * Чистые правила инвентаря: без React, без storage — только договор домена.
 * Используются шопом, последствиями сцен и тестами (Orchestrate /test).
 */
import type { Inventory, Item } from '@/types/game';

import { buildItemRowFromTemplate } from '@/domain/inventory/itemCatalog';
import {
  clampStackQuantity,
  DEFAULT_MAX_INVENTORY_SLOTS,
  MAX_GOLD_AMOUNT,
} from '@/domain/inventory/constants';
import { getLanguage } from '@/i18n/index';

/** Re-export для тестов и внешних импортов. */
export { clampStackQuantity };

export function clampGold(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const n = Math.floor(amount);
  return Math.max(0, Math.min(MAX_GOLD_AMOUNT, n));
}

export function hasInventoryCapacity(currentItemRows: number, maxSlots: number): boolean {
  const cap = Math.max(1, maxSlots);
  return currentItemRows < cap;
}

export function effectiveMaxSlots(storedMaxSlots?: number): number {
  if (storedMaxSlots == null || !Number.isFinite(storedMaxSlots)) return DEFAULT_MAX_INVENTORY_SLOTS;
  return Math.max(1, Math.floor(storedMaxSlots));
}

function parseQuantityInput(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return clampStackQuantity(Math.trunc(v));
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? clampStackQuantity(Math.trunc(n)) : clampStackQuantity(fallback);
  }
  return clampStackQuantity(fallback);
}

/** Стабильный id строки инвентаря для предметов из сцен (по ключу шаблона). */
export function templateItemRowId(templateKey: string): string {
  return `tpl:${templateKey}`;
}

/** Строка предмета для последствий сцен; метаданные — из `itemCatalog`, иначе эвристика имени. */
export function itemRowFromTemplateKey(templateKey: string, quantity: number): Item {
  return buildItemRowFromTemplate(templateKey, quantity, getLanguage());
}

export type StackableTemplateOutcome = 'merged' | 'added' | 'no_capacity' | 'invalid';

/**
 * Добавляет или увеличивает стек предмета с id `tpl:<templateKey>`.
 * Контент строки задаётся шаблоном ключа (см. ADR 0002).
 */
export function addStackableTemplateItem(
  inv: Inventory,
  templateKey: string,
  quantityRaw: unknown,
): { inventory: Inventory; outcome: StackableTemplateOutcome } {
  const key = typeof templateKey === 'string' ? templateKey.trim() : '';
  if (!key) return { inventory: inv, outcome: 'invalid' };

  const qty = parseQuantityInput(quantityRaw, 1);
  if (qty <= 0) return { inventory: inv, outcome: 'invalid' };

  const maxSlots = effectiveMaxSlots(inv.maxSlots);
  const id = templateItemRowId(key);
  const idx = inv.items.findIndex((i) => i.id === id);

  if (idx >= 0) {
    const row = inv.items[idx];
    const nextQty = clampStackQuantity(row.quantity + qty);
    const items = inv.items.slice();
    items[idx] = { ...row, quantity: nextQty };
    return { inventory: { ...inv, items }, outcome: 'merged' };
  }

  if (inv.items.length >= maxSlots) {
    return { inventory: inv, outcome: 'no_capacity' };
  }

  const row = itemRowFromTemplateKey(key, qty);
  return {
    inventory: { ...inv, items: [...inv.items, row] },
    outcome: 'added',
  };
}

/** Уменьшает стек или удаляет строку `tpl:<templateKey>`. */
export function removeStackableTemplateItem(inv: Inventory, templateKey: string, quantityRaw: unknown): Inventory {
  const key = typeof templateKey === 'string' ? templateKey.trim() : '';
  if (!key) return inv;

  const qty = parseQuantityInput(quantityRaw, 1);
  if (qty <= 0) return inv;

  const id = templateItemRowId(key);
  const idx = inv.items.findIndex((i) => i.id === id);
  if (idx < 0) return inv;

  const row = inv.items[idx];
  const nextQty = row.quantity - qty;
  const items = inv.items.slice();
  if (nextQty <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx] = { ...row, quantity: nextQty };
  }
  return { ...inv, items };
}
