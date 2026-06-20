import { describe, expect, it } from 'vitest';

import { listTranslationKeys } from '@/i18n';

describe('i18n key parity', () => {
  it('en dictionary contains all ru keys', () => {
    const ru = new Set(listTranslationKeys('ru'));
    const en = new Set(listTranslationKeys('en'));
    const missing = [...ru].filter((k) => !en.has(k));
    expect(missing).toEqual([]);
  });

  it('ru dictionary contains all en keys', () => {
    const ru = new Set(listTranslationKeys('ru'));
    const en = new Set(listTranslationKeys('en'));
    const missing = [...en].filter((k) => !ru.has(k));
    expect(missing).toEqual([]);
  });
});
