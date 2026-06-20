# Production Contracts

## Asset Contract (minimum fields)

- `assetId`: уникальный id.
- `assetType`: `character | environment | prop | vfx | audio | ui`.
- `tier`: `hero | mid | background`.
- `owner`: команда или ответственный.
- `source`: `internal | outsource | marketplace`.
- `license`: тип лицензии и ссылка на подтверждение.
- `lodCount`: целое число >= 3 для 3D-ассетов.
- `hasCollision`: bool.
- `skeletonProfile`: nullable string (для персонажей/анимаций).
- `localeCoverage`: список поддерживаемых языков для UI/VO.
- `status`: `blockout | review | approved | integrated | deprecated`.

## Validation Gates

1. Schema validation.
2. Tech checks (LOD, naming, PBR maps, rig compatibility).
3. Legal checks (license доказуема и совместима с дистрибуцией).
4. Integration checks (refs, fallback, runtime smoke).

## Data Ownership

- Runtime-контракты и типы в `app/src/types`.
- Production graphics registry: `app/src/domain/assets/chronosProductionRegistry.ts`.
- Контент intake-манифесты в `app/production`.
- В случае конфликта контрактов изменение проводится через ADR/DECISION и миграцию.
