---
tags: [knowledge, tech-stack]
type: tech-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Tech Stack Encyclopedia

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Three.js | latest | 3D rendering |
| R3F | latest | React Three.js |
| Tailwind | 3.4.x | Styling |
| Zustand | latest | State management |
| Framer Motion | latest | Animations |

## Build & Tooling

| Tool | Purpose |
|------|---------|
| Vite | Dev server + build |
| ESLint | Linting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| TypeScript | Type checking |

## Performance Targets

| Metric | Target |
|--------|--------|
| Bundle (gzipped) | < 500KB |
| First paint | < 2s |
| Time to interactive | < 3s |
| Frame rate | 60fps |
| Memory | < 500MB |

## Code Patterns

### Component Structure

```tsx
interface Props {
  // Required props
  onAction: () => void;
  // Optional
  className?: string;
}

export function Component({ onAction, className }: Props) {
  // Hooks at top
  const state = useState();
  
  // Early returns
  if (!state) return null;
  
  // Render
  return <div className={className}>...</div>;
}
```


### State Management

```ts
// Global state - Zustand
const useGameStore = create<GameState>((set) => ({
  player: null,
  setPlayer: (player) => set({ player }),
}));

// Local state - useState
const [value, setValue] = useState(defaultValue);

// Derived - useMemo
const derived = useMemo(() => compute(value), [value]);
```


### Error Boundaries

- Always wrap async operations
- Provide fallback UI
- Log to console + desktop
