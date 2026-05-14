import { describe, expect, it } from 'vitest';

import { buildItemRowFromTemplate, getItemTemplateDefinition, labelsForTemplateItem } from '@/domain/inventory/itemCatalog';

describe('itemCatalog', () => {
  it('resolves catalog metadata for herb', () => {
    const def = getItemTemplateDefinition('herb');
    expect(def?.type).toBe('consumable');
    expect(def?.rarity).toBe('common');
    const row = buildItemRowFromTemplate('herb', 3, 'ru');
    expect(row.id).toBe('tpl:herb');
    expect(row.quantity).toBe(3);
    expect(row.type).toBe('consumable');
    expect(row.name.length).toBeGreaterThan(0);
  });

  it('falls back for unknown template keys', () => {
    const row = buildItemRowFromTemplate('unknown_xyz', 1, 'en');
    expect(row.type).toBe('consumable');
    expect(row.rarity).toBe('common');
    expect(row.name).toContain('Xyz');
  });

  it('labelsForTemplateItem returns null for non-catalog tpl ids', () => {
    expect(labelsForTemplateItem('tpl:custom_loot', 'ru')).toBeNull();
  });

  it('labelsForTemplateItem localizes catalog tpl ids', () => {
    const L = labelsForTemplateItem('tpl:herb', 'en');
    expect(L?.name.toLowerCase()).toContain('herb');
  });
});
