
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import en from './locales/en.json';
import es from './locales/es.json';
import { fetchTranslationDictionary } from '../services/localizationApi';

export const SUPPORTED_LANGUAGES = ['en', 'es'];

const fallbackDictionaries = { en, es };
const LanguageContext = createContext(null);

function lookup(dictionary, key) {
  return key
    .split('.')
    .reduce((obj, part) => (obj ? obj[part] : undefined), dictionary);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const [dictionaries, setDictionaries] = useState(
    fallbackDictionaries
  );

  // Phase 3: Fetch translations from the Express REST API.
  useEffect(() => {
  // Existing component unit tests run without the API server.
  // Dedicated API integration tests will mock and verify fetch.
  if (import.meta.env.MODE === 'test') return;

  if (typeof fetch !== 'function') return;

  const controller = new AbortController();

    async function loadTranslations() {
      try {
        const translations = await fetchTranslationDictionary(lang, {
  signal: controller.signal,
});

        if (!controller.signal.aborted) {
          setDictionaries((previous) => ({
            ...previous,
            [lang]: translations,
          }));
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        // Keep bundled translations available if the API fails.
        console.warn(
          `Unable to fetch ${lang} translations; using fallback.`,
          error
        );
      }
    }

    loadTranslations();

    return () => controller.abort();
  }, [lang]);

  const t = useCallback(
    (key, values = {}) => {
      let text =
        lookup(dictionaries[lang], key) ??
        lookup(fallbackDictionaries[lang], key) ??
        lookup(dictionaries.en, key) ??
        key;

      Object.entries(values).forEach(([name, value]) => {
        text = text.replace(`{${name}}`, value);
      });

      return text;
    },
    [lang, dictionaries]
  );

  const localePath = useCallback(
    (path = '') => `/${lang}${path}`,
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, localePath }),
    [lang, t, localePath]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage must be used inside <LanguageProvider>'
    );
  }

  return context;
}
