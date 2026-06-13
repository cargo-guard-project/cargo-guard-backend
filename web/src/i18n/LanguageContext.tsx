import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { languageLocales, translations, type Language, type TranslationKey } from './translations';

interface LanguageContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  formatDate: (value?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('cargoguard.language');
    return stored === 'uk' ? 'uk' : 'en';
  });

  const value = useMemo<LanguageContextValue>(() => {
    const locale = languageLocales[language];
    return {
      language,
      locale,
      setLanguage: (nextLanguage) => {
        localStorage.setItem('cargoguard.language', nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: (key) => translations[language][key] || translations.en[key],
      formatDate: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
