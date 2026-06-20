# NPC AI Model Stack (Realistic / Lifelike)

Цель: реалистичное и устойчивое поведение NPC с согласованностью между world-state, памятью NPC и диалогом.

## Рекомендуемая стек-модель (hybrid)

### Tier A (default local-first)

- **Primary local model**: `Llama-3.1-8B-Instruct-q4f32_1-MLC` (текущий baseline в `localAI.ts`).
- **Alt local model**: `Qwen2.5-7B-Instruct` (как fallback-профиль для multi-lingual/structured response).
- **Use case**: оффлайн-игра, быстрый интерактив, приватность.

### Tier B (cloud assist for key NPCs)

- **Cloud premium** (для главных персонажей/квестов): семейство GPT-5.x или Claude Sonnet/Opus класса.
- **Cloud balanced**: Mistral 7B/8x или Qwen Instruct через API-провайдер с function-calling.
- **Use case**: ключевые сцены, сложные социальные развилки, эмоционально насыщенные диалоги.

### Tier C (procedural background)

- Procedural-only для `proc_*` NPC (уже реализовано в коде).
- **Use case**: массовая толпа и фоновые реплики без GPU-пиков.

## Синхронизация "живости" NPC

Чтобы NPC выглядели естественно, модель должна быть не единственным источником поведения:

1. **Psych state first**: стресс/травма/доверие из симуляции задают "рамку" ответа.
2. **Memory retrieval**: top memories по importance+recency+term hits (уже в `localAI.ts`).
3. **Relationship binding**: `trust/affection/respect/fear` обязательно в prompt-контексте.
4. **World anchoring**: время/погода/локация/эпоха влияют на тон и содержание ответа.
5. **Consistency cache**: кэш по `npc + worldState + dialogueState + model`.

## Профили внедрения

- `npc_profile_performance`: только local 7B/8B + короткий max_tokens.
- `npc_profile_balanced`: local default + cloud fallback для сюжетных NPC.
- `npc_profile_cinematic`: cloud-first для критических диалогов, local fallback при недоступности сети.

## Контроль качества NPC-моделей

Перед расширением на прод:

- regression-сценарии на memory consistency;
- тест на style drift (ломка характера NPC между репликами);
- тест на world inconsistency (противоречия времени/погоды/фактам);
- latency SLA per tier (dialogue p95).
