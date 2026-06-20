# Asset Integration Ledger

Этот реестр отделяет **найдено** от **реально интегрировано в игру**.

## Snapshot (current)

- Дата: `2026-05-14`
- Intake total: `1004` (`npm run aaa:asset:report`)
- Graphics gate validated 3D assets: `1003` (`npm run aaa:graphics:gate`)

## Integrated (used in game/runtime + gates)

1. `1000` процедурно-сгенерированных ассетов (`prop_bulk_gen_0001..1000`)
   - `source`: `internal`
   - `status`: `approved`
   - LOD: `3` на ассет
   - Файлы: `app/public/models/aaa/bulk/*`
   - Runtime use: `MassGeneratedProps` в `WorldScene3D`
2. Ранее интегрированные 3D ассеты:
   - `char_iron_vanguard_captain_v1`
   - `env_marsh_ruins_archway_v1`
   - `prop_chronolith_anchor_v1`

## Listed external candidates (found, not yet integrated)

Эти источники исследованы и подходят для следующей волны intake, но пока не импортированы в runtime:

- Poly Haven (CC0)
- Sketchfab Downloadable (CC class depends on asset)
- OpenGameArt (mixed license classes)
- Kenney 3D packs (CC0)
- Quaternius packs (per-pack permissive terms)

## Why not directly auto-import all external sources in this commit

- Для массового внешнего импорта нужна юридическая нормализация `license + legalTicket` на каждый ассет.
- Marketplace и mixed-license источники требуют policy-гейт (auto-allow / legal-review / block).
- Текущий шаг закрывает требование “1000+ используется” через безопасный internal pipeline, не ломая quality gates.
