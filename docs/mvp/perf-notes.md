# Производительность (MVP)

- **069 (черновик):** Типичный сеанс: хром/электрон, 1080p, игра 10–20 мин, панель квестов + карта. WebLLM грузится в фоне с таймаутом `CHRONOS_WEBLLM_WEIGHT_LOAD_TIMEOUT_SEC` (см. `domain/ai/webllmConstants.ts`); при таймауте остаётся процедурный слой — GPU не держит диалоги.
- **070 / GPU:** При свёрнутом окне Electron (`minimize` → IPC `chronos-occlusion`) и при `document.visibilityState === 'hidden'` снимается непрерывный цикл R3F (`frameloop="never"` в `WorldScene3DCanvas`), см. `useChronosPowerSavePaused`.
- Рекомендация: перед релизом снять Performance trace (Chrome) на `advanceTime` + worker слухов при 50+ слухах.
