/**
 * validation.js - server-side checks for the auth and profile routes (Student 1).
 * Same rules as client/src/utils/validation.js, so the user sees the same messages.
 * The front end checks too, but only for quick feedback: the server is the real check.
 *
 * Each check returns a translation key (the front end shows it in EN or ES) or null.
 * validate() turns them into the error list the front end expects:
 *   [{ field: 'email', message: 'auth.errors.email' }]
 */
export const INDUSTRIES = ['Wholesale', 'Hotel', 'Corporate Events', 'Other'];
export const LANGUAGES = ['en', 'es'];
export const ACCOUNT_TYPES = ['Retail', 'B2B'];

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/; // bcrypt only reads the first 72 bytes
const WEBSITE_PATTERN = /^https?:\/\/\S+\.\S+$/;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export function required(value, max = 200) {
  const clean = text(value);
  if (!clean) return 'auth.errors.required';
  return clean.length > max ? 'auth.errors.tooLong' : null;
}

export function optional(value, max = 200) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return 'auth.errors.required';
  return value.trim().length > max ? 'auth.errors.tooLong' : null;
}

export function email(value) {
  return required(value, 254) || (EMAIL_PATTERN.test(text(value)) ? null : 'auth.errors.email');
}

export function password(value) {
  if (typeof value !== 'string' || !value) return 'auth.errors.required';
  return PASSWORD_PATTERN.test(value) ? null : 'auth.errors.passwordRules';
}

export function website(value) {
  if (!text(value)) return null;
  return text(value).length <= 255 && WEBSITE_PATTERN.test(text(value)) ? null : 'auth.errors.website';
}

export function oneOf(value, list) {
  return list.includes(value) ? null : 'auth.errors.required';
}

// { field: keyOrNull } -> [{ field, message }] with only the failures
export function validate(checks) {
  return Object.entries(checks)
    .filter(([, message]) => message)
    .map(([field, message]) => ({ field, message }));
}

// Trims a string field, or returns the fallback when it is missing
export const clean = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);
