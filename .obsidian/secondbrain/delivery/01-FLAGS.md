---
tags: [delivery, flags]
type: feature-flags
created: 2026-06-20
updated: 2026-06-20
---
# Feature Flags

| Флаг | Включён | Rollout | Зависимости |
|------|---------|---------|-------------|
| new_npc_dialogue_system | false | 0% | - |
| advanced_weather | true | 100% | - |
| future_world_era | false | 0% | - |
| coalition_hud | true | 100% | - |
| quest_progress_hud | true | 100% | - |

## Управление

```bash
?feature=name=true  # URL параметр
```

## Деплоймент зависимости

- advanced_weather > world rendering
- coalition_hud > UI components
