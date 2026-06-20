---
tags: [security, scan]
type: security-log
created: 2026-06-20
updated: 2026-06-20
---
# Security Scanner

## Secrets Patterns

| Pattern | Severity |
|---------|----------|
| api[_-]?key[\"]?\s*[:=]\s*[\"\'][^\"\']{8,} | critical |
| secret[\"]?\s*[:=]\s*[\"\'][^\"\']{8,} | critical |
| password[\"]?\s*[:=]\s*[\"\'][^\"\']{8,} | critical |
| token[\"]?\s*[:=]\s*[\"\'][^\"\']{8,} | critical |
| bearer\s+[a-zA-Z0-9_-]{20,} | critical |
| ghp_[a-zA-Z0-9]{36} | critical |
| sk-[a-zA-Z0-9]{48} | critical |

## Vulnerabilities

| Pattern | Severity |
|---------|----------|
| eval\s*\( | high |
| innerHTML\s*= | high |
| dangerouslySetInnerHTML | high |

## Scan Results

| Τΰιλ | Òθο | Line | Status |
|------|-----|------|--------|
