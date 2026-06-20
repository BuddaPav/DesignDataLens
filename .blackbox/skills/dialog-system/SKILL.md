---
name: dialog-system
description: Manage dialog windows and modal interactions. Use when showing dialogs.
---

# Dialog System

## When to use this skill

- Modal dialogs
- Confirmation dialogs
- Form dialogs

## Dialog Structure

```typescript
interface DialogConfig {
  id: string
  title: string
  content: ReactNode
  actions: DialogAction[]
  closable?: boolean
}
```

## Operations

- Open/close dialogs
- Handle dialog actions
- Track open dialogs

## Cross-references

- [[menu-builder]] - Menus
- [[notification-manager]] - Notifications
- [[panel-constructor]] - Panels