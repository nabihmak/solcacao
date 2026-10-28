/**
 * authService - sign-up, sign-in and session calls for the auth screens.
 *
 * Phase 2: answered by the in-browser mock data layer (mockApi.js).
 * Phase 3: each function becomes a fetch() call to the Express API, e.g.
 *   registerUser -> POST /api/auth/register   (201 { token, user })
 *   loginUser    -> POST /api/auth/login      (200 { token, user })
 *   fetchCurrentUser -> GET /api/auth/me      (200 { user })
 */
import * as mockApi from './mockApi';
import { tokenStorage } from './tokenStorage';

export function registerUser(payload) {
  return mockApi.register(payload);
}

export function loginUser(email, password) {
  return mockApi.login(email, password);
}

export function fetchCurrentUser() {
  return mockApi.getMe(tokenStorage.get());
}

export function logoutUser() {
  return mockApi.logout(tokenStorage.get());
}
