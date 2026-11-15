/**
 * apiClient - one place for calls to the Express API (Student 1).
 *
 *   const { user } = await apiRequest('/api/auth/me');
 *   await apiRequest('/api/users/addresses', { method: 'POST', body: address });
 *
 * - Sends the saved sign-in token as "Authorization: Bearer <token>".
 * - In development Vite forwards /api to the server on port 3001 (vite.config.js).
 *   For a deployed site, set VITE_API_BASE_URL to the server's address.
 * - Failed calls throw an Error with .status and .errors, the same shape the
 *   forms already read (utils/apiErrors.js). No connection -> status 0.
 */
import { tokenStorage } from './tokenStorage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Full address of an API path, for calls made with other tools (e.g. axios file uploads)
export const apiUrl = (path) => API_BASE + path;

function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

// token: pass one to use it instead of the saved token, or null to send none
export async function apiRequest(path, { method = 'GET', body, token = tokenStorage.get() } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw apiError(0, 'Cannot reach the server');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw apiError(response.status, data.message || 'Request failed', data.errors || []);
  return data;
}

// The sign-in header on its own, for calls that do not send JSON (file uploads)
export function authHeader() {
  const token = tokenStorage.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
