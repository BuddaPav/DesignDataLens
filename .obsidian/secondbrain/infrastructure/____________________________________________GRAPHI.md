# Именование файлов ассетов — единая схема в `GRAPHICS_INVENTORY`.

```typescript
```typescript
// src/components/game/InventoryPanel.tsx

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

function displayItemLines(item: Item, lang: Language): { name: string; description: string } {
  const tpl = labelsForTemplateItem(item.id, lang);
  if (tpl) return { name: tpl.name, description: tpl.description };
  return { name: item.name, description: 'No description available' };
}

function InventoryPanel({ inventory, stats, onDropItem, onOfferToNpc }: InventoryPanelProps) {
  const lang = useLanguage();

  return (
    <div>
      {inventory.items.map((item) => (
        <div key={item.id}>
          <span>{displayItemLines(item, lang).name}</span>
          <p>{displayItemLines(item, lang).description}</p>
          {/* Add other item details and actions here */}
        </div>
      ))}
    </div>
  );
}

export default InventoryPanel;
```
```

Generated: 2026-06-22T06:49:01.241Z