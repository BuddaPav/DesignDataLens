# Content Factory

## Цель

Сделать intake ассетов контролируемым и воспроизводимым: legal + tech + report.

## Артефакты

- Intake manifest: `app/production/asset-intake.json`
- Schema baseline: `app/production/asset-contracts.schema.json`
- Validation gate: `app/scripts/aaa-asset-factory-gate.mjs`
- Reporting: `app/scripts/aaa-asset-report.mjs`

## Intake Flow

1. Ассет поступает в intake с обязательной metadata.
2. Запускается schema/legal/tech валидация.
3. При успешной проверке ассет получает `approved` и идет в integration queue.
4. При ошибке ассет получает reject reason и возвращается владельцу.

## Required Checks

- Schema consistency с `app/production/asset-contracts.schema.json`.
- Лицензия указана и проверяема.
- Для 3D ассетов `lodCount >= 3`.
- Для персонажей есть `skeletonProfile`.
- Для marketplace-источника есть `legalTicket`.
- Для UI/VO заполнен `localeCoverage`.

## Команды

- `cd app && npm run aaa:asset-factory:gate`
- `cd app && npm run aaa:graphics:gate`
- `cd app && npm run aaa:asset:report`
