/**
 * tokenStorage - keeps the login token in localStorage so the user stays
 * signed in after a page reload. Wrapped in try/catch because localStorage
 * can be blocked (for example in some private browsing modes).
 */
const TOKEN_KEY = 'solcacao_token';

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore: the user will simply need to sign in again after a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};
