# Vertical Slice Gate

## Цель

Принять решение `greenlight` или `pivot` по результатам вертикального среза.

## Артефакты

- Манифест: `app/production/vertical-slice-manifest.json`
- Валидатор: `app/scripts/aaa-vertical-slice-gate.mjs`
- Команда: `cd app && npm run aaa:vertical-slice:gate`

## Обязательные критерии

1. Минимальный объем контента среза достигнут:
   - hero assets >= target,
   - models >= target,
   - animations >= target,
   - vfx >= target,
   - musicMinutes >= target.
2. Пройдены технологические гейты:
   - `orchestrateGatePassed`,
   - `questFlowSmokePassed`,
   - `performanceBudgetPassed`,
   - `fallbackPathsVerified`.
3. Результат валидатора фиксируется в релизном протоколе итерации.

## Правило решения

- Если все критерии зеленые: `greenlight full production`.
- Если есть провалы: `pivot/scope correction` и повторный slice gate.
