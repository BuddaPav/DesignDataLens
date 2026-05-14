# Бюджет GLB / 3D для MVP (ориентир **035**)

Цель: предсказуемый FPS на «типовой» машине (1080p, tier **balanced**).

| Элемент | Рекомендация MVP |
|---------|-------------------|
| Один декоративный GLB (`OptionalLocalGlb`) | **≤ 25k** треугольников, **≤ 3** материала PBR, текстуры **≤ 2K** |
| Одновременно на экране (open world) | **≤ 2** опциональных GLB в радиусе видимости |
| Draw calls (прочее процедурное + пост-FX) | держать tier **low** на слабых GPU — см. `WorldGraphicsTier` |

Импорт ассетов: класть в `public/` или статический импорт через Vite; при превышении бюджета — повысить `minTier` у `OptionalLocalGlb` или уменьшить `maxDistance`.

См. также `docs/orchestrate/perf-budgets.json` и `docs/mvp/perf-notes.md`.
