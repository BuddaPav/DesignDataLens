# ADR 0004: контракт социальных слухов и «спина» отношений

## Статус

Принято

## Контекст

В мире Chronos два слоя слухов: (1) мгновенный сдвиг доверия соседей и локальной репутации при контакте (`NPCSystem.interactWithPlayer`), (2) глобальный рынок `storyProgress.activeRumors` с TTL и распространением по графу локаций и караванам (`gossipNetwork`, worker при больших шагах времени). Риск — рассинхрон текстов, знака эффекта и фракционных тегов, если логика останется только в движке без явных правил.

## Решение

1. **Домен** `app/src/domain/social/`:
   - `npcIndividuality.ts` — чистые функции `effectiveGossipImpact` (как тип отношений искажает пересказ) и `shouldNpcSpreadGossip` (экстраверсия, невротизм при низком доверии, согласие при тёплых связях).
   - `gossipFactionTags.ts` — `factionTagsForGossipNpc` (единый источник тегов для `ActiveRumor.factionTags` и дрейфа `factionReputation`).
2. **Движок** `NPCSystem` применяет домен после обновления `playerRelationship`; доверие соседей и `reputation` по ключу `location:<id>` считаются от **эффективного** импакта.
3. **`buildSocialGossipActiveRumor`** в `gossipNetwork.ts` строит запись `ActiveRumor` для рынка слухов с текстом по знаку эффективного импакта; `useGameState` добавляет её в `activeRumors` с буфером последних записей.
4. **Диалог** (`dialogueSystem`): отдельные приветствия для `lover` и `close_friend` до общих веток по affection/trust.

## Последствия

- Изменение социальной математики — через домен + тесты `npcIndividuality.test.ts` / `gossipFactionTags.test.ts`.
- Новые типы отношений или фракции — расширять домен и при необходимости `factionReputationRules`.
