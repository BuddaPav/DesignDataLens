# Full Production Scale Plan

## Tier Model

- **Hero Tier:** уникальные элементы критического пути (главные персонажи, landmark локации, boss encounters).
- **Mid Tier:** повторяемые, но заметные элементы (региональные NPC, боевые наборы, вторичные квестовые точки).
- **Background Tier:** массовый world dressing (props, foliage, ambience loops).

## Production Targets (high-level)

- Environment: 1200+ props, 120+ modular kits, 80+ landmarks.
- Characters: 25+ key characters, 150+ crowd variants.
- Animation: 1500+ clips.
- VFX: 400+ effects.
- Audio: 20k+ SFX events, 8h+ music.
- Narrative: 150+ quests, 80k+ lines.

## Tracking

- Цели и факт: `app/production/full-production-status.json`.
- Проверка прогресса: `cd app && npm run aaa:full-production:progress`.
- Отчет использовать на еженедельном production review.

## Scaling Rules

1. Любой новый контент сначала относится к tier-классу.
2. Hero-tier не аутсорсится без internal final pass.
3. Mid/Background допускают outsourcing при прохождении intake gate.
4. Контент, не проходящий performance budgets, не может быть переведен в `integrated`.
