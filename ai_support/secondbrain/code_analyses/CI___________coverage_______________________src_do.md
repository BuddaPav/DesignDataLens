# CI: артефакт coverage только при изменении `src/domain`.

```typescript
```typescript
const isDomainChanged = (files: string[]): boolean => {
  return files.some(file => file.startsWith('src/domain'));
};

export const generateCoverageReport = async (changedFiles: string[]): Promise<void> => {
  if (!isDomainChanged(changedFiles)) {
    console.log('No changes in src/domain. Skipping coverage report.');
    return;
  }

  // Здесь код для генерации отчета о покрытии
  // Например, вызов команды для Jest или другого инструмента
  await runCommand('npm test --coverage');
};

const runCommand = (command: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = require('child_process').exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log(stdout);
        resolve();
      }
    });
  });
};
```
```

Generated: 2026-06-22T06:22:23.828Z