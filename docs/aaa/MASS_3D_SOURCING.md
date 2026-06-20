# Mass 3D Sourcing (1000+)

Цель: быстро и безопасно обеспечить минимум 1000 разных 3D-моделей для Chronos с трассируемой лицензией и автоматической валидацией.

## Статус в репозитории

- В проекте включен генератор `app/scripts/generate-aaa-mass-model-pack.mjs`.
- Команда `cd app && npm run generate:mass:3d` генерирует и регистрирует:
  - `1000` ассет-семейств (`prop_bulk_gen_0001..1000`);
  - `3000` файлов LOD (`lod0/1/2`) в `app/public/models/aaa/bulk/`;
  - обновленный `app/production/asset-intake.json` (`1004` total assets с базовыми + bulk).
- Все ассеты проходят gate:
  - `npm run aaa:asset-factory:gate`
  - `npm run aaa:graphics:gate`

## Внешние источники (для следующей волны импорта)

Ниже — приоритетный shortlist, чтобы перейти от процедурных заглушек к production-библиотеке.

1. `Poly Haven` (CC0, публичный домен): безопасный baseline для прямого импорта.
2. `Sketchfab Downloadable` (CC BY / CC0 / иные лицензии): высокий объем, нужен строгий legal фильтр по каждому assetId.
3. `OpenGameArt` (OGA-BY/CC-BY/CC0): подходит для стилизованных паков, обязательно сохранять авторство в registry.
4. `Kenney` (CC0 пакеты): хорошая стилистическая целостность для low/mid-tier ассетов.
5. Marketplace-каналы (`CGTrader`, `TurboSquid`, `KitBash`, и т.д.) только через legalTicket и license whitelist.

## Legal contract для внешнего импорта

Для каждого внешнего ассета обязательно:

- `source`: `marketplace` или `outsource`.
- `license`: нормализованное значение (например, `cc0`, `cc-by-4.0`, `royalty-free-pro`).
- `legalTicket`: обязательный ID (`LEGAL-*`) с привязкой к контракту/чеку.
- `assetId` без коллизий, `graphics.modelPath` + `lodFiles` + `triangleCount/materialCount`.

## Что считать "используется в игре"

Минимальный критерий "used":

1. ассет есть в `asset-intake.json`,
2. ассет проходит `aaa:asset-factory:gate` и `aaa:graphics:gate`,
3. ассет участвует в runtime-спавне через `WorldScene3D`.

Именно по этому критерию текущий bulk-пак уже интегрирован в игру.
