# Глоссарий Chronos: AI Chronicles

Краткие определения для единого языка в коде и документации.

| Термин | Значение |
|--------|----------|
| **Chronos** | Исполняемый клиент в `app/`: нарративная RPG с процедурным миром и NPC. |
| **Orchestrate** | Соглашение о pipeline: правила Cursor + ADR + скрипты `npm` (`docs/orchestrate/`). |
| **ADR** | Architecture Decision Record — запись решения в `docs/adr/`. |
| **Мир** | Процедурные тайлы (`worldTiles`), сплошные координаты; общие данные для 2D и 3D. |
| **Инвентарь** | `Inventory`: золото, предметы, лимит слотов; доменные правила в `domain/inventory/`. |
| **Сцена** | Единица повествования: narrative + choices + опционально dialogue. |
| **NPC** | Персонаж с памятью, отношениями и диалоговым контуром (процедурный + опционально WebLLM). |
| **Эпоха мира** | `worldEra`: medieval / modern / future — влияет на лор и декор. |
| **Gate** | `npm run orchestrate:gate` — lint + тесты + проверка циклов зависимостей. |
| **Scaffold** | Архитектурный шаблон в `app/src/scaffolds/` (Event Bus, Pool, FSM, ECS-lite, BT). |
| **[TECH_DEBT]** | Явная маркировка долга в коде + строка в `docs/orchestrate/TECH_DEBT.md`. |
| **Prototype (Orchestrate)** | Эксперимент с TTL и маркером `[PROTOTYPE]`; автоудаление файлов агентом запрещено. |
