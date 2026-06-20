---
tags: [artifacts, adr]
type: architecture-decisions
created: 2026-06-20
updated: 2026-06-20
---
# Architecture Decision Records

## ADR 001: MongoDB over PostgreSQL

- **Title**: Use MongoDB for game state
- **Decision**: MongoDB выбран для хранения состояния игроков и NPC
- **Consequences**: 
  - Гибкие схемы NPC 
  - Простая эволюция данных
- **Status**: accepted
- **Date**: 2026-06-20

## ADR 002: Three.js over Babylon

- **Title**: Use Three.js for rendering
- **Decision**: Three.js + R3F выбран для 3D
- **Consequences**:
  - Большая экосистема
  - Лучшая React интеграция
- **Status**: accepted
- **Date**: 2026-06-20

## ADR 003: In-memory over Redis

- **Title**: Use in-memory for local dev
- **Decision**: In-memory storage локально
- **Consequences**:
  - Простая разработка
  - Миграция на Redis позже
- **Status**: accepted
- **Date**: 2026-06-20
