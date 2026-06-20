---
tags: [knowledge, testing]
type: testing-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Testing Encyclopedia

## Test Types

### Unit Tests (Vitest)

```ts
describe('GameState', () => {
  it('should add item to inventory', () => {
    const state = new GameState();
    state.addItem(sword);
    expect(state.inventory).toContain(sword);
  });
});
```

### Coverage Target: 80%

### E2E Tests (Playwright)

```ts
test('new game flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-test=new-game]');
  await expect(page.locator('#game-screen')).toBeVisible();
});
```

## Test Structure

```
src/
+-- __tests__/
¦   +-- unit/
¦   ¦   +-- GameState.test.ts
¦   ¦   L-- Inventory.test.ts
¦   L-- e2e/
¦       +-- new-game.spec.ts
¦       L-- combat.spec.ts
```

## CI Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build
```

## Quality Gates

| Gate | Threshold |
|------|-----------|
| Coverage | > 80% |
| Lint | 0 errors |
| Tests | 100% pass |
| Build | 0 errors |

## Debugging Tests

```bash
npm run test:watch
npm run test:coverage
npm run test:e2e:debug
```
