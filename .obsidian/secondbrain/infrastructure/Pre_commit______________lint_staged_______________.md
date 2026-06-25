# Pre-commit опционально: lint-staged только для затронутых файлов.

```typescript
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix"
    ],
    "*.{css,scss}": [
      "stylelint --fix"
    ],
    "*.{html,md}": [
      "prettier --write"
    ]
  }
}
```
```

Generated: 2026-06-22T08:22:56.926Z