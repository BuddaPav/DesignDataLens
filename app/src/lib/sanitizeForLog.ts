/**
 * Обрезка и очистка пользовательских / произвольных строк перед записью в логи (#75, #78).
 */

const DEFAULT_MAX = 8000;

/** Убирает управляющие символы и ограничивает длину одной записи. */
export function sanitizeForLog(input: string, maxChars: number = DEFAULT_MAX): string {
  let cleaned = '';
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    cleaned += c >= 32 && c !== 127 ? input[i]! : ' ';
  }
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars)}\n...[truncated]\n`;
}
