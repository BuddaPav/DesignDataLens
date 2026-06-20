# Art Bible

## Visual Pillars

1. Semi-realistic stylized dark sci-fantasy.
2. Сильная читаемость силуэтов в любой погоде и времени суток.
3. High-frequency detail только на Hero-tier ассетах и focal points.
4. Цветовой контраст строится от фракции + биома, не от случайных HDR-эффектов.

## Asset Tiers

- **Hero:** сюжетно важные персонажи, landmark-объекты, ключевые props.
- **Mid:** боевые и интерактивные элементы, повторяемые NPC/props.
- **Background:** filler geometry, foliage variants, distant dressing.

## Biome Palette Contract

- У каждого биома должна быть:
  - базовая палитра (dominant/secondary/accent),
  - set материалов (ground/rock/foliage/architecture),
  - погодные модификаторы (wetness/fog/saturation shift),
  - список запрещенных визуальных конфликтов.

## Character Direction

- Силуэт персонажа должен читаться на расстоянии LOD1.
- Фракционная идентичность выражается через форму, не только через цвет.
- Armor/cloth/weapon language согласуется с worldEra и лором.

## Environment Direction

- Каждый регион содержит минимум:
  - 1 Hero landmark,
  - 2-3 Mid focal clusters,
  - повторяемый набор Background fillers с вариативностью.

## Definition of Done (Art)

- Ассет подтвержден Art Lead.
- Ассет прошел Tech Art валидацию (см. `TECH_ART_BIBLE.md`).
- Ассет зарегистрирован в production registry с owner/version/license.
