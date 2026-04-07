'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
  ReactNode,
} from 'react';

import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

export type Locale = 'zh-CN' | 'zh-TW' | 'en';

type TranslationValue = string | Record<string, unknown>;

type TranslationDict = {
  app: Record<string, string>;
  common: Record<string, string>;
  settings: Record<string, string>;
  input: Record<string, string>;
  results: Record<string, string>;
  errors: Record<string, string>;
  upload: Record<string, string>;
  languages: Record<string, string>;
};

const locales: Record<Locale, TranslationDict> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en: en,
};

function resolvePath(obj: TranslationValue | undefined, path: string): string | undefined {
  if (!obj) return undefined;
  const keys = path.split('.');
  let current: TranslationValue | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, TranslationValue>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && locales[saved]) return saved;
  } catch {
    // SSR or localStorage unavailable
  }
  return 'zh-CN';
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  locales: Locale[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const initialLocale = useSyncExternalStore(
    () => () => {},
    getInitialLocale,
    () => 'zh-CN' as Locale,
  );

  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('locale', newLocale);
    } catch {
      // ignore
    }
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      const dict = locales[locale];
      const value = resolvePath(dict as unknown as TranslationValue, key);
      if (value === undefined) {
        return key;
      }
      return interpolate(value, params);
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: Object.keys(locales) as Locale[] }}>
      {children}
    </I18nContext.Provider>
  );
}
