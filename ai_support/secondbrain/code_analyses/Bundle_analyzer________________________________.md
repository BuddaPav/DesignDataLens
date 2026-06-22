# Bundle analyzer в отчёт артефакта раз в спринт.

```typescript
```typescript
import { analyzeBundle } from 'webpack-bundle-analyzer';
import webpackConfig from './webpack.config';

async function analyzeWebpackBundle() {
  const report = await analyzeBundle(webpackConfig);
  return report;
}

export default analyzeWebpackBundle;
```

Эта функция `analyzeWebpackBundle` использует библиотеку `webpack-bundle-analyzer`, чтобы проанализировать сборку и сгенерировать отчёт о размерах пакетов. Возвращаемый отчёт можно использовать для анализа и оптимизации производительности игры.
```

Generated: 2026-06-22T06:05:46.628Z