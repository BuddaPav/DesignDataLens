# Audio Bible

## Audio Pillars

- Музыка поддерживает драматургию региона/фракции/сцены.
- SFX читаемы в миксе и не конфликтуют с UI/VO.
- VO приоритетна для main arc и ключевых персонажей.

## Content Classes

- **Music:** exploration, tension, combat, narrative stingers.
- **SFX:** environment, interaction, combat, UI.
- **VO:** critical path scenes, faction intros, companion banter.

## Production Rules

- Все аудио-ассеты содержат metadata: owner, source, license, loudness class.
- LUFS target определяется по платформенному профилю.
- Версионирование и naming единообразны для всех стемов и rendered assets.

## Integration

- Runtime playback не должен ломать fallback-поведение текущего `SoundManager`.
- Любой переход на middleware должен сохранить deterministic/gameplay-critical события.

## Definition of Done (Audio)

- Ассет прошел loudness и clipping check.
- Ассет привязан к конкретному event id.
- Ассет зафиксирован в production registry.
