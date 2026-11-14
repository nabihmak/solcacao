
/**
 * Student 2 - Phase 3
 * Fetch server-side language dictionaries.
 */

export async function fetchTranslationDictionary(
  lang,
  { signal } = {}
) {
  const response = await fetch(
    `/api/i18n/${encodeURIComponent(lang)}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const translations = await response.json();

  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations) ||
    !translations.nav ||
    typeof translations.nav !== "object"
  ) {
    throw new Error("Invalid translation response");
  }

  return translations;
}
