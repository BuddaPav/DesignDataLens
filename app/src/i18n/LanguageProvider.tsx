import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Language } from './index';
import { getLanguage } from './index';
import { CHRONOS_SETTINGS_STORAGE_KEY } from '@/lib/chronosGameSettings';

type LanguageContextValue = {
  language: Language;
};

const LanguageContext = createContext<LanguageContextValue>({ language: 'ru' });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getLanguage());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'en' ? 'en' : 'ru';
    }
  }, [language]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHRONOS_SETTINGS_STORAGE_KEY) setLanguage(getLanguage());
    };
    const onCustom = () => setLanguage(getLanguage());
    window.addEventListener('storage', onStorage);
    window.addEventListener('chronos:settings_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('chronos:settings_updated', onCustom);
    };
  }, []);

  const value = useMemo(() => ({ language }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Language {
  return useContext(LanguageContext).language;
}

