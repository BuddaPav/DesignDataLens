---
name: accessibility-checker
description: Check UI accessibility compliance. Use when validating accessibility.
---

# Accessibility Checker

## When to use this skill

- Accessibility validation
- ARIA compliance
- Keyboard navigation check

## Accessibility Structure

```typescript
interface AccessibilityReport {
  issues: A11yIssue[]
  score: number
  passed: boolean
}
```

## Operations

- Scan UI components
- Check keyboard navigation
- Generate report

## Cross-references

- [[responsive-adapter]] - Responsive
- [[hud-builder]] - HUD