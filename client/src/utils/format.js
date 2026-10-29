/**
 * Formatting helpers shared by the catalog and the cart (Student 3).
 */

// Prices are stored in USD. Spanish uses the es-US format so "$" stays "$".
export function formatPrice(amount, lang = 'en') {
  return new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Picks the right language from a { en, es } field, falling back to English
export function localized(field, lang) {
  if (!field || typeof field !== 'object') return field ?? '';
  return field[lang] ?? field.en ?? '';
}
