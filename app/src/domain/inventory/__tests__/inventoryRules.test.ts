import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_INVENTORY_SLOTS,
  MAX_GOLD_AMOUNT,
  MAX_ITEM_STACK
} from '@/domain/inventory/constants';
import type { Inventory } from '@/types/game';

import {
  addStackableTemplateItem,
  clampGold,
  clampStackQuantity,
  effectiveMaxSlots,
  hasInventoryCapacity,
  removeStackableTemplateItem,
  templateItemRowId,
} from '@/domain/inventory/inventoryRules';

describe('inventoryRules', () => {
  describe('clampGold', () => {
    it('clamps to [0, MAX_GOLD_AMOUNT]', () => {
      expect(clampGold(-5)).toBe(0);
      expect(clampGold(MAX_GOLD_AMOUNT + 1)).toBe(MAX_GOLD_AMOUNT);
      expect(clampGold(42.7)).toBe(42);
    });
    it('returns 0 for NaN', () => {
      expect(clampGold(Number.NaN)).toBe(0);
    });
  });

  describe('hasInventoryCapacity', () => {
    it('respects maxSlots', () => {
      expect(hasInventoryCapacity(0, DEFAULT_MAX_INVENTORY_SLOTS)).toBe(true);
      expect(
        hasInventoryCapacity(DEFAULT_MAX_INVENTORY_SLOTS, DEFAULT_MAX_INVENTORY_SLOTS)
      ).toBe(false);
    });
  });

  describe('clampStackQuantity', () => {
    it('clamps to MAX_ITEM_STACK', () => {
      expect(clampStackQuantity(MAX_ITEM_STACK + 10)).toBe(MAX_ITEM_STACK);
      expect(clampStackQuantity(-1)).toBe(0);
    });
  });

  describe('effectiveMaxSlots', () => {
    it('defaults when missing', () => {
      expect(effectiveMaxSlots(undefined)).toBe(DEFAULT_MAX_INVENTORY_SLOTS);
    });
    it('defaults when NaN / non-finite', () => {
      expect(effectiveMaxSlots(Number.NaN)).toBe(DEFAULT_MAX_INVENTORY_SLOTS);
    });
    it('floors and enforces minimum 1', () => {
      expect(effectiveMaxSlots(12.9)).toBe(12);
      expect(effectiveMaxSlots(0)).toBe(1);
    });
  });

  describe('addStackableTemplateItem', () => {
    const emptyInv = (): Inventory => ({
      gold: 0,
      items: [],
      maxSlots: 4,
    });

    it('merges stacks with same template key', () => {
      const inv = emptyInv();
      const r1 = addStackableTemplateItem(inv, 'herb', 2);
      expect(r1.outcome).toBe('added');
      expect(r1.inventory.items[0].quantity).toBe(2);
      const r2 = addStackableTemplateItem(r1.inventory, 'herb', 3);
      expect(r2.outcome).toBe('merged');
      expect(r2.inventory.items).toHaveLength(1);
      expect(r2.inventory.items[0].id).toBe(templateItemRowId('herb'));
      expect(r2.inventory.items[0].quantity).toBe(5);
    });

    it('returns no_capacity when full', () => {
      let inv = emptyInv();
      for (let i = 0; i < 4; i++) {
        inv = addStackableTemplateItem(inv, `k${i}`, 1).inventory;
      }
      expect(inv.items).toHaveLength(4);
      const r = addStackableTemplateItem(inv, 'extra', 1);
      expect(r.outcome).toBe('no_capacity');
      expect(r.inventory.items).toHaveLength(4);
    });

    it('returns invalid for empty template key', () => {
      const inv = emptyInv();
      expect(addStackableTemplateItem(inv, '', 1).outcome).toBe('invalid');
      expect(addStackableTemplateItem(inv, '   ', 1).outcome).toBe('invalid');
    });

    it('returns invalid for non-positive quantity', () => {
      const inv = emptyInv();
      expect(addStackableTemplateItem(inv, 'herb', 0).outcome).toBe('invalid');
      expect(addStackableTemplateItem(inv, 'herb', -3).outcome).toBe('invalid');
    });
  });

  describe('removeStackableTemplateItem', () => {
    it('removes stack partially or fully', () => {
      let inv: Inventory = {
        gold: 0,
        items: [],
        maxSlots: 10,
      };
      inv = addStackableTemplateItem(inv, 'coin_pouch', 5).inventory;
      inv = removeStackableTemplateItem(inv, 'coin_pouch', 2);
      expect(inv.items[0].quantity).toBe(3);
      inv = removeStackableTemplateItem(inv, 'coin_pouch', 10);
      expect(inv.items).toHaveLength(0);
    });

    it('no-op when template missing or quantity not positive', () => {
      let inv: Inventory = {
        gold: 0,
        items: [],
        maxSlots: 10,
      };
      inv = addStackableTemplateItem(inv, 'herb', 2).inventory;
      const same = removeStackableTemplateItem(inv, 'unknown_tpl', 1);
      expect(same.items).toEqual(inv.items);
      const sameQty = removeStackableTemplateItem(inv, 'herb', 0);
      expect(sameQty.items).toEqual(inv.items);
    });

    it('no-op when template key empty', () => {
      const inv: Inventory = { gold: 0, items: [], maxSlots: 4 };
      expect(removeStackableTemplateItem(inv, '', 1)).toBe(inv);
    });
  });
});
