/**
 * Именованные константы домена инвентаря (без «магических чисел» в правилах и UI).
 * См. ADR docs/adr/0002-inventory-domain-rules.md
 */

/** Верхняя граница золота для безопасных расчётов в клиенте (игровой потолок). */
export const MAX_GOLD_AMOUNT = 999_999_999;

/** Слотов по умолчанию (до расширения мета-прогрессией). */
export const DEFAULT_MAX_INVENTORY_SLOTS = 40;

/** Максимум единиц одного предмета в стеке (общая полка). */
export const MAX_ITEM_STACK = 999;

/** Ограничение количества в стеке для расчётов инвентаря и шаблонных предметов. */
export function clampStackQuantity(qty: number): number {
  if (!Number.isFinite(qty)) return 0;
  const n = Math.floor(qty);
  return Math.max(0, Math.min(MAX_ITEM_STACK, n));
}
