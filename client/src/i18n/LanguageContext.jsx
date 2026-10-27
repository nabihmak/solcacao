/**
 * LanguageContext - global localisation state (English / Spanish).
 *
 * Usage inside any component:
 *   const { lang, t, localePath } = useLanguage();
 *   t('nav.home')          -> "Home" or "Inicio"
 *   localePath('/catalog') -> "/en/catalog" or "/es/catalog"
 *
 * Dictionaries are local JSON files for now. Student 2 can later load
 * them from the server (GET /api/i18n/:lang) without changing components.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'];
const dictionaries = { en, es };

const LanguageContext = createContext(null);

// Reads a nested key such as "nav.home" from a dictionary object
function lookup(dictionary, key) {
  return key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), dictionary);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  // Translate a key. Falls back to English, then to the key itself.
  // Optional values replace {placeholders}, e.g. t('x', { name: 'Ana' }).
  const t = useCallback(
    (key, values = {}) => {
      let text = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key;
      Object.entries(values).forEach(([name, value]) => {
        text = text.replace(`{${name}}`, value);
      });
      return text;
    },
    [lang]
  );

  // Builds a path with the current language prefix
  const localePath = useCallback((path = '') => `/${lang}${path}`, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, localePath }), [lang, t, localePath]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return context;
}
