# Шифрование чувствительных локальных данных — threat model в ADR.

```typescript
```typescript
import * as crypto from 'crypto';

interface EncryptableData {
  data: string;
}

class DataEncryptor {
  private key: Buffer;

  constructor(key: Buffer) {
    this.key = key;
  }

  public encrypt(data: EncryptableData): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(data.data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return JSON.stringify({ iv: iv.toString('hex'), encryptedData: encrypted });
  }

  public decrypt(encryptedData: string): string {
    const data = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, Buffer.from(data.iv, 'hex'));
    let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Пример использования
const key = crypto.randomBytes(32); // Генерация случайного ключа для AES-256
const encryptor = new DataEncryptor(key);

const sensitiveData: EncryptableData = { data: 'my-sensitive-data' };
const encrypted = encryptor.encrypt(sensitiveData);
console.log('Encrypted:', encrypted);

const decrypted = encryptor.decrypt(encrypted);
console.log('Decrypted:', decrypted);
```
```

Generated: 2026-06-22T08:19:55.149Z