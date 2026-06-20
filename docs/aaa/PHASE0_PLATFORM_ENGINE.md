# Phase 0 Platform and Engine Matrix

## Target Matrix (baseline)

| Platform | Target FPS | GPU/VRAM profile | Notes |
|---|---:|---|---|
| Windows desktop (recommended) | 60 (high), 45 (fallback) | mid-high discrete / 6-12 GB | Основной канал поставки (Electron). |
| Windows low-spec | 30-45 | integrated / 2-4 GB | Обязательный путь через low/balanced tiers и fallback. |
| Browser (secondary) | 30-60 | depends on browser/WebGPU | Дополнительный режим, не primary target. |

## Engine Decision Gate

- Базовый стек остается React/Three/Electron до прохождения ADR gate.
- Рассмотрение альтернативного движка (Unity/Godot/Unreal) допустимо только если:
  1. доказан потолок perf/streaming на текущем стеке,
  2. доменные контракты и save-совместимость формально описаны,
  3. есть миграционный план контента и инструментария.

## Evidence Required

- `npm run orchestrate:gate` стабильно зеленый на целевой ветке.
- Vertical slice perf snapshots приложены к milestone review.
- Решение задокументировано в ADR и `PROJECT_MILESTONES.md`.
