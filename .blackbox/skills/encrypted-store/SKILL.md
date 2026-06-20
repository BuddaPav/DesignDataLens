---
name: encrypted-store
description: Encrypted storage for sensitive data. Use when securing save data.
---

# Encrypted Store

## When to use this skill

- Data encryption
- Secure storage
- Key management

## Encryption Structure

```typescript
interface EncryptedStore {
  algorithm: EncryptionAlgorithm
  keyId: string
  data: Uint8Array
}
```

## Operations

- Encrypt data
- Decrypt data
- Rotate keys

## Cross-references

- [[save-manager]] - Save
- [[cloud-storage]] - Storage