# Проверка `lang` атрибута при смене языка в рантайме.

```typescript
```typescript
function setLanguage(lang: string): void {
  const html = document.documentElement;
  if (html.lang !== lang) {
    html.setAttribute('lang', lang);
  }
}
```
```

Generated: 2026-06-22T06:36:13.468Z