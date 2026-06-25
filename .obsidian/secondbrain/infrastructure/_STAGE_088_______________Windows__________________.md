# [STAGE 088] Подпись кода Windows (если требуется дистрибуция вне Store).

```typescript
```typescript
import { FeatureFlags } from '@/types/game/feature-flags';
import { getLogger } from '@/utils/logger';

const logger = getLogger('windows-signature');

export const signWindowsCode: (path: string) => Promise<void> = async (path) => {
  if (!FeatureFlags.WINDOWS_SIGNATURE_ENABLED) {
    logger.info('Windows signature feature is disabled.');
    return;
  }

  try {
    // Placeholder for actual Windows signing logic
    // This would typically involve using a command-line tool like 'signtool'
    const result = await exec(`signtool sign /f "path/to/certificate.pfx" /p "password" "${path}"`);
    if (result.status !== 0) {
      throw new Error(`Failed to sign Windows code: ${result.stderr}`);
    }
    logger.info('Windows code signed successfully.');
  } catch (error) {
    logger.error('Error signing Windows code:', error);
    throw error;
  }
};

const exec = (command: string): Promise<{ status: number; stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const child = spawn(command, [], { shell: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      resolve({ status: code, stdout, stderr });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};
```

```typescript
npm run build
```
```

Generated: 2026-06-22T11:54:24.074Z