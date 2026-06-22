# [STAGE 088] Подпись кода Windows (если требуется дистрибуция вне Store).

```typescript
```typescript
import { sign } from 'crypto';

function signCode(inputBuffer: Buffer, privateKey: string): string {
    return sign('sha256', inputBuffer, privateKey);
}

// Пример использования:
const codeToSign = Buffer.from('Your code here');
const privateKey = 'your-private-key-here';
const signature = signCode(codeToSign, privateKey);

console.log(signature.toString('hex'));
```
```

Generated: 2026-06-22T08:06:02.873Z