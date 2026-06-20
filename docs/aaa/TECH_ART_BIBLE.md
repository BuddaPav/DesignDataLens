# Tech Art Bible

## Mesh and LOD

- Каждый static mesh: `LOD0/LOD1/LOD2` обязательно.
- Hero assets: `LOD3` для дальних дистанций.
- Pivot стандартизован относительно gameplay-use (ground center или interaction anchor).
- Collision обязательна для всех интерактивных ассетов.
- Для `approved/integrated` 3D-ассетов обязателен реальный `modelPath` и набор `lodFiles` в intake-контракте.

## PBR and Textures

- Обязательные карты: `albedo`, `normal`, `roughness`, `metallic` (или packed ORM).
- Текстуры без baked lighting/shadows.
- Mipmaps обязательны.
- Texel density фиксируется по классу ассета в intake metadata.

## Rig and Animation Contracts

- Единый skeleton profile version для humanoid/faction classes.
- Ретаргет допускается только между совместимыми skeleton profiles.
- Для персонажей с диалогом обязателен facial rig standard.

## Naming

- Формат: `{category}_{factionOrBiome}_{name}_v{major}`.
- LOD: суффиксы `_lod0`, `_lod1`, `_lod2`, `_lod3`.
- Материалы: `m_{asset}_{surface}`.
- Текстуры: `t_{asset}_{mapType}_{res}`.

## File and Source Rules

- Source-of-truth файлы хранятся в DCC source storage.
- Runtime импортируется как glTF/GLB и регистрируется в asset registry.
- Любая смена пути ассета требует синхронизации ссылок и fallback.

## Performance Budget Policy

- Бюджеты определяются платформенным профилем.
- Любой ассет вне бюджета блокирует merge до waiver от Tech Art Lead.
- Waiver фиксируется как `[TECH_DEBT: CHRONOS-TD-NNN]` + запись в реестре долга.
- Автоматизированная проверка intake 3D-ассетов: `npm run aaa:graphics:gate`.
