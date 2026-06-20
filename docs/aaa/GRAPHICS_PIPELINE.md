# Graphics and 3D Model Pipeline

## Scope

Документ описывает обязательный baseline intake для 3D-моделей и графических ассетов.

## Core Inputs

- Intake contracts: `app/production/asset-intake.json`.
- Schema: `app/production/asset-contracts.schema.json`.
- Graphics budgets: `app/production/graphics-standards.json`.

## Validation Chain

0. `npm run generate:placeholder:3d` (если в репозитории пока нет реальных 3D-файлов)  
   Создает минимальные mesh-based LOD glTF для smoke/contract pipeline.
0.1 `npm run generate:mass:3d` (массовая генерация 1000+ моделей для интеграционного масштаба)  
   Создает bulk-набор LOD glTF (`app/public/models/aaa/bulk`) и регистрирует ассеты в `asset-intake.json`.
1. `npm run aaa:asset-factory:gate`  
   Проверяет schema/ownership/legal и базовый контракт.
2. `npm run aaa:graphics:gate`  
   Проверяет 3D-бюджеты (triangles/materials/textures/LOD/modelFormat), обязательные model-файлы для `approved/integrated` и сверяет `triangleCount/materialCount` с фактом из `*.gltf`.
3. `npm run aaa:asset:report`  
   Сводка по типам/tier/status для production review.

## 3D Budget Baseline

- Hero: `<=25000` triangles, `<=3` materials, `<=2048` max texture.
- Mid: `<=15000` triangles, `<=3` materials, `<=2048` max texture.
- Background: `<=8000` triangles, `<=2` materials, `<=1024` max texture.
- Минимальный LOD chain: `lodCount >= 3`.

## Status to Files Policy

- `blockout/review`: допускается `modelPath: null` и пустой `lodFiles`.
- `approved/integrated`: обязателен `graphics.modelPath` и `graphics.lodFiles` (не меньше `minLodCount`) с существующими файлами в `app/public`.
