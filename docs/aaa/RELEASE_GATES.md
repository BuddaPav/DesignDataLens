# Alpha Beta Release Gates

## Alpha Gate

- Content complete по целям production.
- Критичные квесты и core loops проходят smoke.
- Нет blocker-дефектов класса crash/save corruption.

## Beta Gate

- Feature freeze активирован.
- Локализация и accessibility lock на целевых языках.
- Performance budget соблюден на целевых платформах.

## Release Candidate Gate

- Crash budget в допустимом диапазоне.
- Save compatibility подтверждена.
- Installer/distribution pipeline подтвержден.
- Certification checklist пройден и зафиксирован.

## Automation

- Manifest: `app/production/release-readiness.json`
- Command: `cd app && npm run aaa:release:gate`
