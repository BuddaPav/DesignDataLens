# План рефакторинга — AFK Game (Chronos AI Chronicles)

## Контекст проекта
- **Tech stack**: React 19.2 + Vite 7.2 + Three.js/R3F + Electron 35.7
- **Файлов**: 235 TS/TSX | **Строк**: 35,166 | **Покрытие**: 55.71%
- **Архитектура**: layered (UI → hooks → engine → domain → types)

---

## Приоритетные области рефакторинга

### 1. useGameState.ts (1897 строк) — High Priority
**Проблема**: Огромный central hook
**Решение**:
- [ ] Выделить sub-hooks: `useTimeAdvance`, `useNPCs`, `useWorld`, `useTrade`
- [ ] Добавить typed hooks с контрактами
- [ ] Покрыть тестами >= 70%

### 2. Engine modules — Medium Priority
**Проблема**: Низкое покрытие (35%)
**Решение**:
- [ ] `generations.ts` — добавить unit tests
- [ ] `MemorySystem.ts` — покрыть 60%+
- [ ] `dialogueSystem.ts` — интеграционные тесты

### 3. Graphics Tier — Low Priority
**Проблема**: Нет reset to defaults
**Решение**:
- [ ] Добавить `resetGraphicsSettings()` в lib/chronosGraphicsSettings.ts
- [ ] Валидация tier при загрузке

### 4. WebLLM integration — Medium Priority
**Проблема**: Fallback на procedural не документирован
**Решение**:
- [ ] Добавить documentation в localAI.ts
- [ ] Тесты для offline mode

---

## Метрики до/после

| Метрика | До | После |
|---------|-----|--------|
| useGameState.ts | 1897 строк | ~800 |
| Engine coverage | 35% | 60% |
| Circular deps | 0 | 0 |
| Large files >1000 | 4 | 1 |

---

## Verification

```bash
npm run orchestrate:gate  # lint + test + circular
npm run test:coverage    # check coverage
```

---

*Generated: 2026-06-19*
*Source: docs/aaa/full_audit_report.md*