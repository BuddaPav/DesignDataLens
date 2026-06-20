## Second Brain Orchestrator (secondbrain)
- ������:
  1. ��������� 13 ������ ������
  2. ����� ���� ������� (Decision Log)
  3. ����������� TODOs � ������
  4. ���������� Trust Score
  5. ������������� ������� ����
  6. ��������� feature flags
  7. ������������ onboarding snapshots
- ������: full fs, memory, npm build
- ������: 30 ������
# Агенты автономной разработки

## Orchestrator (Главный агент)
- Период: 30 секунд
- Приоритет: 1 (build fixing)
- Возможности: npm build, file system, AI code fix

## Агент Code Builder (code-builder)
- Задачи:
  1. Сканировать TypeScript errors
  2. Авто-исправлять через Ollama
  3. Фиксить TODO/FIXME
  4. Учиться из зависимостей
- Доступ: full fs, npm, ollama

## Агент NPC Architect (npc-architect)
- Задачи:
  1. Генерировать новых NPC
  2. Проверять консистентность сюжета
  3. Валидировать диалоги
- Контекст: lore база, NPC шаблоны

## Агент World Builder (world-builder)
- Задачи:
  1. Генерировать биомы
  2. Проверять связность локаций
  3. Валидировать переходы
- Контекст: карта мира, биомы

## Агент Economy Designer (economy-designer)
- Задачи:
  1. Балансировать экономику
  2. Проверять цены
  3. Валидировать торговлю
- Контекст: цены, экономика

## Агент UI Craftsman (ui-craftsman)
- Задачи:
  1. Проверять accessibility
  2. Валидировать UX паттерны
  3. Генерировать UI спеки

## Агент Test Runner (test-runner)
- Задачи:
  1. Запускать тесты
  2. Анализировать покрытие
  3. Репортить failures

## Агент Performance Profiler (performance-profiler)
- Задачи:
  1. Профилировать бандл
  2. Проверять размер
  3. Анализировать FPS

## Агент Documentation Generator (documentation-generator)
- Задачи:
  1. Генерировать API docs
  2. Обновлять CHANGELOG
  3. Создавать ADR

## Агент Security Auditor (security-auditor)
- Задачи:
  1. Сканировать secrets
  2. Проверять уязвимости
  3. Валидировать SBOM

## Агент Human Evaluator (human-evaluator)
- Задачи:
  1. Оценивать UI фидбек
  2. Проверять геймплей
  3. Собирать метрики