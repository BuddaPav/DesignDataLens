# Промт для агента: Система автоматического создания игры AFK Game

## КОНТЕКСТ

Ты - AI-агент, которому нужно продолжить реализацию системы автоматического создания игры. Система уже частично реализована, тебе нужно продолжить с того места, где остановились.

### Текущее состояние системы (уже реализовано):

1. **Build проходит успешно** - в папке app/ выполняется `npm run build` без ошибок
2. **Skills Registry** - `.cursor/agents/core/skills-registry.ts` содержит 118+ скилов и систему биндинга агентов
3. **Pre-write Validation** - в `ai_support/agents/autonomousOrchestrator.ts` есть функция `validateContent()` которая проверяет дубликаты импортов и функций ПЕРЕД записью
4. **Skill Bindings** - определены биндинги для economyDesigner, npc-architect, world-builder, ui-craftsman, code-validator

### Что нужно доработать:

## ЗАДАЧА 1: Интегрировать FileValidator в autonomousOrchestrator

Файл `ai_support/secondbrain/FileValidator.ts` существует, но НЕ используется агентами. Нужно интегрировать его вызов в `autonomousOrchestrator.ts` рядом с существующей `validateContent()`.

**Файл для модификации:** `ai_support/agents/autonomousOrchestrator.ts`

**Пример интеграции:**
```typescript
import { FileValidator } from '../secondbrain/FileValidator';

// Добавить перед записью файла:
const validator = new FileValidator();
const result = validator.checkContent(targetFile, newCode);
if (!result.valid) {
  throw new Error(`Validation failed: ${result.errors.join(', ')}`);
}
```

## ЗАДАЧА 2: Активировать Second Brain cognitive files

Нужно добавить запись в second brain после каждой выполненной задачи.

**Файлы для активации:**

1. `ai_support/secondbrain/cognitive/learnings.json` - записывать успешные паттерны
2. `ai_support/secondbrain/cognitive/trust.json` - обновлять метрики доверия к агентам
3. `ai_support/secondbrain/task_state.json` - состояние задач

**Пример структуры learnings.json:**
```json
{
  "learnings": [
    {
      "pattern": "pre-write validation prevents duplicate imports",
      "success": true,
      "task": "economyDesigner.generateShop",
      "timestamp": "2026-06-22T12:00:00Z"
    }
  ]
}
```

## ЗАДАЧА 3: Добавить Timeout и Rate Limiting в LLM вызовы

В autonomousOrchestrator.ts уже есть частичная реализация. Нужно убедиться что:

1. Timeout = 30 секунд для всех LLM вызовов (использовать AbortController)
2. Rate limiting = 50 запросов в минуту для Anthropic API
3. Graceful degradation = 8 fallback провайдеров при недоступности основного

**Проверить в:** `ai_support/agents/autonomousOrchestrator.ts`

## ЗАДАЧА 4: Привязать Skills к Agents

Нужно использовать `getSkillsForAgent()` из skills-registry.ts при вызове агентов.

**Пример интеграции:**
```typescript
import { getSkillsForAgent } from '../../.cursor/agents/core/skills-registry';

// Перед вызовом агента:
const requiredSkills = getSkillsForAgent('economyDesigner');
console.log('Required skills:', requiredSkills);
```

## ЗАДАЧА 5: Git Auto-Restore при Build Failure

Добавить автоматическое восстановление из git если build падает после записи агента.

**Реализация:**
```typescript
import { execSync } from 'child_process';

function autoRestoreOnBuildFail(filePath: string) {
  try {
    execSync('npm run build', { cwd: './app', stdio: 'pipe' });
  } catch (e) {
    console.log('Build failed, restoring from git...');
    execSync(`git checkout HEAD -- ${filePath}`, { cwd: './app' });
    throw new Error('Build failed, file restored');
  }
}
```

## ПОРЯДОК РЕАЛИЗАЦИИ

1. Сначала прочитай существующий код в указанных файлах
2. Не добавляй новые файлы - только модифицируй существующие
3. После каждого изменения запускай `npm run build` в папке app/
4. Build должен проходить без ошибок после каждого изменения
5. Не удаляй существующий код - только расширяй

## КРИТЕРИИ УСПЕХА

1. ✅ `npm run build` проходит без ошибок
2. ✅ Нет TypeScript ошибок (`npx tsc --noEmit`)
3. ✅ pre-write validation работает
4. ✅ skills привязаны к агентам
5. ✅ second brain записывает паттерны

## ВАЖНЫЕ ФАЙЛЫ

- `app/package.json` - главный package.json (там где работает npm run build)
- `ai_support/agents/autonomousOrchestrator.ts` - главный оркестратор
- `.cursor/agents/core/skills-registry.ts` - skills registry с биндингами
- `ai_support/secondbrain/FileValidator.ts` - валидатор файлов
- `ai_support/secondbrain/cognitive/learnings.json` - паттерны

## СТАРТ

Начни с чтения файлов:
1. `ai_support/agents/autonomousOrchestrator.ts`
2. `.cursor/agents/core/skills-registry.ts`
3. `ai_support/secondbrain/FileValidator.ts`

Затем реализуй задачи по порядку, начиная с ЗАДАЧА 1.