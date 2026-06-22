# # Tasks - one per line
# Оркестратор остановлен для отладки

```typescript
```typescript
import { useOrchestrator } from '@/hooks/orchestrator';

const StopOrchestration = () => {
  const { stopOrchestration } = useOrchestrator();

  return (
    <button onClick={stopOrchestration}>
      Stop Orchestration
    </button>
  );
};

export default StopOrchestration;
```
```

Generated: 2026-06-22T16:43:58.940Z