# Post-mortem: Meshy API недоступен

## Date: 2026-06-20

## Incident
Не удалось использовать Meshy AI для генерации 3D моделей

## Root Cause
Meshy не предоставил бесплатный API ключ

## Impact
- 50 моделей не сгенерированы автоматически
- Ручной fallback: batch генерация 51 GLB

## Resolution
Создан скрипт `generate-placeholder-3d.mjs` для ручной генерации

## Lessons Learned
- ✅ Всегда иметь backup план
- ✅ 51 GLB файл создан вручную

## Prevention
- Документировать API key requirements
- Заранее тестировать API access