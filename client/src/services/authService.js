/**
 * authService - sign-up, sign-in and session calls for the auth screens (Student 1).
 * Each function calls the Express API (backend/routes/auth.js):
 *   registerUser      -> POST /api/auth/register   (201 { token, user })
 *   loginUser         -> POST /api/auth/login      (200 { token, user })
 *   fetchCurrentUser  -> GET  /api/auth/me         (200 { user })
 *   logoutUser        -> POST /api/auth/logout     (204)
 */
import { apiRequest } from './apiClient';

export function registerUser(payload) {
  return apiRequest('/api/auth/register', { method: 'POST', body: payload, token: null });
}

export function loginUser(email, password) {
  return apiRequest('/api/auth/login', { method: 'POST', body: { email, password }, token: null });
}

export function fetchCurrentUser() {
  return apiRequest('/api/auth/me');
}

// Same check for a token given by the caller (used by the cart data layer)
export function fetchUserForToken(token) {
  return apiRequest('/api/auth/me', { token: token || null });
}

export function logoutUser() {
  return apiRequest('/api/auth/logout', { method: 'POST' });
}
