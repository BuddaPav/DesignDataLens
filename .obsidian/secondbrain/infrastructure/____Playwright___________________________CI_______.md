# Кэш Playwright браузера и зависимостей в CI (если подключён).

```typescript
```typescript
import { cacheDir, run } from 'playwright-core';

const CACHE_KEY = 'playwright-cache';
const DEPENDENCIES_CACHE_KEY = 'dependencies-cache';

async function getCachedPlaywrightBrowser() {
  const cachedDir = await cacheDir();
  const browserPath = `${cachedDir}/${CACHE_KEY}`;

  if (fs.existsSync(browserPath)) {
    return fs.readFileSync(browserPath, 'utf8');
  }

  // Если браузер не в кэше, скачиваем его и сохраняем
  const browser = await playwright.chromium.launch();
  await browser.close();

  fs.writeFileSync(browserPath, CACHE_KEY);
  return CACHE_KEY;
}

async function getCachedDependencies() {
  const cachedDir = await cacheDir();
  const dependenciesPath = `${cachedDir}/${DEPENDENCIES_CACHE_KEY}`;

  if (fs.existsSync(dependenciesPath)) {
    return fs.readFileSync(dependenciesPath, 'utf8');
  }

  // Если зависимости не в кэше, скачиваем их и сохраняем
  await npmInstall(); // Предположим, что у нас есть функция для установки зависимостей

  fs.writeFileSync(dependenciesPath, DEPENDENCIES_CACHE_KEY);
  return DEPENDENCIES_CACHE_KEY;
}

async function runTests() {
  const browserKey = await getCachedPlaywrightBrowser();
  const dependenciesKey = await getCachedDependencies();

  console.log(`Using cached Playwright browser: ${browserKey}`);
  console.log(`Using cached dependencies: ${dependenciesKey}`);

  // Запуск тестов с использованием кэшированных ресурсов
  await runTestsWithCachedResources();
}

runTests().catch(console.error);
```
```

Generated: 2026-06-22T06:40:48.574Z