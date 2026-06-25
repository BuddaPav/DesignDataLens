# Локализация установщика (ru/en).

```typescript
```typescript
type Language = 'ru' | 'en';

const translations: Record<Language, Record<string, string>> = {
  ru: {
    install: 'Установка',
    welcome: 'Добро пожаловать в игру!',
    startGame: 'Начать игру',
  },
  en: {
    install: 'Install',
    welcome: 'Welcome to the game!',
    startGame: 'Start Game',
  },
};

function translate(key: string, language: Language = 'ru'): string {
  return translations[language][key] || key;
}

// Пример использования
console.log(translate('install')); // Установка
console.log(translate('startGame', 'en')); // Start Game
```
```

Generated: 2026-06-22T08:13:34.523Z