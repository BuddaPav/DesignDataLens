# Голосовой ввод (Web Speech API) как опция доступности.

```typescript
```typescript
import { useEffect } from 'react';

const useVoiceInput = (onSpeechResult: (result: string) => void) => {
  useEffect(() => {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ru-RU'; // Устанавливаем язык распознавания

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (event.results.length > 0) {
        const result = event.results[0][0].transcript;
        onSpeechResult(result);
      }
    };

    recognition.onerror = (error: SpeechRecognitionErrorEvent) => {
      console.error('Ошибка распознавания речи:', error.message);
    };

    recognition.onend = () => {
      console.log('Распознавание окончено');
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [onSpeechResult]);

  return null;
};

export default useVoiceInput;
```
```

Generated: 2026-06-22T06:31:51.509Z