/**
 * apiClient - one place for calls to the Express API (Student 1).
 *
 *   const { user } = await apiRequest('/api/auth/me');
 *   await apiRequest('/api/users/addresses', { method: 'POST', body: address });
 *   await apiRequest('/api/b2b/quote', { method: 'POST', body: formData });  // file upload
 *
 * - Sends the saved sign-in token as "Authorization: Bearer <token>".
 * - A plain object body is sent as JSON; a FormData body (file upload) is sent as is.
 * - In development Vite forwards /api to the server on port 3001 (vite.config.js).
 *   For a deployed site, set VITE_API_BASE_URL to the server's address.
 * - Failed calls throw an Error with .status and .errors, the same shape the
 *   forms already read (utils/apiErrors.js). No connection -> status 0.
 */
import { tokenStorage } from './tokenStorage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Full address of an API path (also used by the localization service)
export const apiUrl = (path) => API_BASE + path;

function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

// token: pass one to use it instead of the saved token, or null to send none
export async function apiRequest(path, { method = 'GET', body, token = tokenStorage.get() } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = {};
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'; // the browser sets it for FormData
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined || isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw apiError(0, 'Cannot reach the server');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw apiError(response.status, data.message || 'Request failed', data.errors || []);
  return data;
}
