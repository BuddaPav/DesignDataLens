---
tags: [knowledge, bugs]
type: bug-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Bug Encyclopedia

## Common Issues

### React

| Issue | Cause | Fix |
|-------|------|-----|
| Stale closures | async in useEffect | useRef or dependency |
| Memory leaks | subscriptions | cleanup in return |
| Double renders | StrictMode | expected in dev |
| Re-render loops | missing useMemo | memoize derived |

### Three.js/R3F

| Issue | Cause | Fix |
|-------|------|-----|
| Black screen | WebGL context | Check renderer init |
| Low FPS | too many lights | Use baked lighting |
| Memory leak | disposed objects | dispose geometry |
| Blinking | camera near/far | Adjust clip planes |

### TypeScript

| Issue | Cause | Fix |
|-------|------|-----|
| any types | missing types | Define proper types |
| Circular deps | mutual imports | Refactor to shared |
| Import errors | path resolve | Check tsconfig |
| Type inferred as never | strict null | Add null check |

### Performance

| Issue | Impact | Fix |
|-------|--------|-----|
| Large bundle | slow load | Code splitting |
| Re-renders | jank | React.memo |
| Memory leak | crash | Cleanup listeners |
| Network spam | lag | Debounce requests |

## Debug Commands

```ts
// Debug state
console.log({ state });

// Performance
performance.mark('label');
// Memory
console.memory;
```

## Investigation Steps

1. Reproduce consistently
2. Isolate the cause
3. Check console errors
4. Verify types
5. Check network tab
