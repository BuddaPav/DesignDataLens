# ADR 010: Three.js + R3F для 3D рендеринга

## Status: Accepted

## Context
Нужен 3D мир с performance для web
Требования: 60 FPS, низкие системные требования

## Decision
Three.js + React Three Fiber

## Reasoning
### За
- Largest ecosystem (500+ packages)
- R3F интеграция с React lifecycle
- Better TypeScript support vs Babylon
- WebGL 2.0 support

### Против
- Больше bundle size
- Потенциальные memory leaks в complex scenes

## Alternatives
- Babylon.js: Better docs, меньше packages
- PlayCanvas: Cloud-first, не подходит для self-host

## Consequences
### Positive
- Massive ecosystem
- R3F = declarative scenes

### Negative
- Нужен код сплиттинг
- SSAO временно убран (N8AO compatibility)

## Related
- ADR 011: Quality LOD system
- ADR 012: Graphics tier system