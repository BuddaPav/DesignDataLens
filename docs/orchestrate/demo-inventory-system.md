# Демонстрация Orchestrate: система **инвентаря**

Один сквозной пример, как работают логические «плагины» на реальном коде.

## 1. memory — ADR

- **ADR 0002:** `docs/adr/0002-inventory-domain-rules.md` — зачем вынесли правила из UI.

## 2. rules — конвенции

- `.cursor/rules/chronos-code-conventions.mdc` — домен в `domain/**`, без магических чисел в правилах.
- Лимиты только в `app/src/domain/inventory/constants.ts`.

## 3. test — TDD

- Тесты: `app/src/domain/inventory/__tests__/inventoryRules.test.ts`.
- Запуск: `cd app && npm run test`.

## 4. Реализация (orchestrate «код»)

- `inventoryRules.ts` — чистые функции + стеки по ключу шаблона (`tpl:<key>`).
- `itemCatalog.ts` — тип/редкость и ключи i18n для известных шаблонов; неизвестные ключи — прежняя эвристика имени.
- `useGameState.applyConsequences` — золото через `clampGold`; `item_gain` / `item_loss` через `addStackableTemplateItem` / `removeStackableTemplateItem`.
- UI (`InventoryPanel`) — для строк `tpl:*` из каталога подписи берутся из i18n при смене языка.

## 5. review

- `npm run lint` без ошибок после добавления файлов.

## 6. perf

- Доменный модуль ~не влияет на бандл заметно; тяжесть инвентаря — в списках UI (виртуализация — отдельная задача).

## 7. git

- Рекомендуемый коммит:  
  `feat(inventory): add domain rules and vitest orchestrate demo`

## 8. docs

- Обновлены: глоссарий, ADR, этот файл, граф зависимостей (при необходимости `npm run deps:export`).

## 9. deps

- `npm run deps:circular` — без циклов.
- При изменении импортов — повторить проверку.

## Итоговая команда ворот

```bash
cd app && npm run orchestrate:gate
```
