# AAA Production Framework

Этот раздел фиксирует production-стандарты для реализации Chronos в формате AAA-studio.

## Документы

- `ART_BIBLE.md` — визуальный стиль, тиры ассетов, силуэты и биомы.
- `TECH_ART_BIBLE.md` — технические требования к 3D, LOD, материалам, ригам и импорту.
- `NARRATIVE_BIBLE.md` — правила сюжетного контента, ветвления и fail-forward.
- `AUDIO_BIBLE.md` — стандарты музыки, SFX, VO и аудио-пайплайна.
- `UI_BIBLE.md` — визуальные/UX-правила UI, accessibility и локализация.
- `CONTRACTS.md` — формальные контракты артефактов и CI-gate критерии.
- `VERTICAL_SLICE_GATE.md` — критерии greenlight для Vertical Slice.
- `CONTENT_FACTORY.md` — пайплайн intake, legal/tech валидация и отчеты.
- `SCALE_PLAN.md` — модель масштабирования full production по tiers.
- `RELEASE_GATES.md` — alpha/beta/release и certification gate.
- `PHASE0_PLATFORM_ENGINE.md` — платформенная матрица и engine decision gate.
- `SOURCING.md` — каналы поставки контента P1–P4 и legal traceability.
- `GRAPHICS_PIPELINE.md` — 3D model/gfx intake pipeline и budget checks.
- `MASS_3D_SOURCING.md` — массовая поставка и интеграция 1000+ 3D ассетов.
- `NPC_AI_MODEL_STACK.md` — стек ИИ-моделей и синхронизация реалистичного поведения NPC.
- `ASSET_INTEGRATION_LEDGER.md` — фактологический реестр “найдено vs реально интегрировано”.

## Связь с Orchestrate

- Базовые ворота проекта: `cd app && npm run orchestrate:gate`.
- Asset/production проверки: `npm run aaa:vertical-slice:gate`, `npm run aaa:asset-factory:gate`, `npm run aaa:release:gate`.
- Новые допущения и компромиссы фиксируются через `[TECH_DEBT]` и `docs/orchestrate/TECH_DEBT.md`.
