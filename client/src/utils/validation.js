/**
 * Client-side validation helpers (Student 1).
 * They mirror the server's Joi rules so users get instant feedback.
 * The server still validates everything again, so these are only for UX.
 *
 * Each helper returns a translation key (string) when the value is invalid,
 * or null when it is valid.
 */
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const WEBSITE_PATTERN = /^https?:\/\/\S+\.\S+$/;

export function required(value) {
  return String(value ?? '').trim() ? null : 'auth.errors.required';
}

export function email(value) {
  return required(value) || (EMAIL_PATTERN.test(value.trim()) ? null : 'auth.errors.email');
}

export function password(value) {
  return required(value) || (PASSWORD_PATTERN.test(value) ? null : 'auth.errors.passwordRules');
}

export function matches(value, otherValue) {
  return required(value) || (value === otherValue ? null : 'auth.errors.passwordMatch');
}

// Optional field: empty is fine, otherwise it must be a full http(s) URL
export function website(value) {
  if (!String(value ?? '').trim()) return null;
  return WEBSITE_PATTERN.test(value.trim()) ? null : 'auth.errors.website';
}

/**
 * Runs a map of { field: errorKeyOrNull } and keeps only the failures.
 * Example: collectErrors({ email: email(form.email) }) -> { email: 'auth.errors.email' }
 */
export function collectErrors(results) {
  return Object.fromEntries(Object.entries(results).filter(([, error]) => error));
}
