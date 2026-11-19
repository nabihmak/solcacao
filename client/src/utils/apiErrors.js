/**
 * Turns an error from the REST API (services/apiClient.js)
 * into something a form can show.
 *
 * Options let a form choose its own translated message for a status,
 * e.g. { unauthorizedKey: 'auth.errors.invalidCredentials' } on the login form.
 *
 * Returns:
 *   message     - a general message (translated when we know the case)
 *   fieldErrors - { fieldName: messageFromServer } for highlighted inputs
 */
export function readApiError(error, t, { unauthorizedKey, badRequestKey } = {}) {
  // Server field errors look like [{ field: 'company.companyName', message: '...' }]
  const fieldErrors = {};
  (error.errors || []).forEach(({ field, message }) => {
    // Student 1 routes send translation keys (auth.errors.*); other messages are plain text
    fieldErrors[field] = message.startsWith('auth.') ? t(message) : message;
  });

  let message;
  if (error.status === 0) message = t('auth.errors.network');
  else if (error.status === 400 && Object.keys(fieldErrors).length) message = t('auth.errors.checkFields');
  else if (error.status === 400 && badRequestKey) message = t(badRequestKey);
  else if (error.status === 401 && unauthorizedKey) message = t(unauthorizedKey);
  else if (error.status === 409) message = t('auth.errors.emailTaken');
  else if (error.status >= 500) message = t('auth.errors.generic');
  else message = error.message || t('auth.errors.generic');

  return { message, fieldErrors };
}
