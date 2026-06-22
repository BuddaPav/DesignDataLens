# Strict TS для тестов постепенно (tsconfig.vitest.json путь).

```typescript
```typescript
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "esnext",
    "target": "es2019",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "../../dist/vitest"
  },
  "include": ["**/*.{test,spec}.{js,ts}"],
  "exclude": ["node_modules", "**/*.d.ts"]
}
```
```

Generated: 2026-06-22T12:18:15.518Z