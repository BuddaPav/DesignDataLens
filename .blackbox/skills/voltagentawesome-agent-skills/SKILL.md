---
name: voltagentawesome-agent-skills
description: Performance optimization and profiling for Chronos game engine. Use when investigating slow renders, memory leaks, or high CPU usage.
---

# Voltagentawesome Agent Skills

## When to use this skill

- React render performance issues
- Memory leaks in game state
- Large file refactoring (useGameState.ts is 1897 lines)
- IndexedDB performance
- Web Worker communication overhead

## Performance Workflow

### Quick Profiling
```bash
# Check for large files (>1000 lines)
npm run obsidian:status

# Run bundle analysis
npm run build -- --analyze
```

### React Performance

| Problem | Tool | Location |
|---------|------|----------|
| Slow renders | React DevTools Profiler | Browser |
| State updates | console.watch in useGameState | hooks/useGameState.ts |
| Re-renders | DevTools timeline | Browser |

### Memory Profiling

```typescript
// Add to investigate memory leaks
performance.memory?.usedJSHeapSize
performance.memory?.jsHeapSizeLimit
```

### 3D Rendering

- WorldScene3D.tsx (1703 lines) - Monitor Three.js render loop
- Check graphics tier settings in chronosGameSettings
- Use R3F stats panel for FPS monitoring

## Key Files to Optimize

| File | Lines | Priority |
|------|-------|----------|
| useGameState.ts | 1897 | HIGH |
| WorldScene3D.tsx | 1703 | HIGH |
| NPCSystem.ts | 968 | MEDIUM |
| i18n/index.ts | 906 | MEDIUM |

## Optimization Patterns

### 1. Memoization
```typescript
// Good
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])

// Bad - recomputes every render
const value = computeExpensiveValue(a, b)
```

### 2. Web Worker
```typescript
// Heavy computation off main thread
const worker = new Worker(new URL('../gossipSpread.worker.ts', import.meta.url))
```

### 3. Virtualization
```typescript
// For long lists (>100 items)
useVirtualizer from @tanstack/react-virtual
```

## Graphics Tiers

| Tier | Quality | Target |
|------|---------|--------|
| low | 720p, no shadows | Mobile |
| balanced | 1080p, basic | Laptop |
| high | 4K, full post-processing | Desktop |

## Cross-references

- [[supermemory]] - Memory management
- [[jwilgeragent-skills]] - Development workflow
- [[context-continuity-guardian]] - State persistence