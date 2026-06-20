# AAA Content Sourcing Policy

## Priority Channels

1. **P1 Internal Core Team**  
   Hero characters, ключевые локации, signature VFX, critical narrative assets.
2. **P2 Co-dev / Outsource Studios**  
   Массовое окружение, crowd variants, secondary animation, часть VFX.
3. **P3 Curated Marketplace (kitbash-only)**  
   Разрешено для blockout/proxy/background после legal+tech intake.
4. **P4 Procedural Tooling**  
   Foliage/rocks/terrain/crowd derivatives в рамках style envelope.

## Legal and Quality Rules

- Любой внешний ассет проходит intake gate перед интеграцией.
- Marketplace assets без доказуемой лицензии блокируются.
- Final shipped hero assets требуют internal final pass.

## Ownership and Traceability

- Каждый ассет имеет owner/team, legalTicket, source и lifecycleStatus.
- Источник правды для графики: `app/src/domain/assets/chronosProductionRegistry.ts`.
