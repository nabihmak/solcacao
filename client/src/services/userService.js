/**
 * userService - profile management calls for signed-in users (Student 1).
 * Each function calls the Express API (backend/routes/users.js) with the sign-in token:
 *   updateProfile  -> PUT    /api/users/profile
 *   changePassword -> PUT    /api/users/password
 *   getAddresses   -> GET    /api/users/addresses
 *   addAddress     -> POST   /api/users/addresses
 *   updateAddress  -> PUT    /api/users/addresses/:id
 *   deleteAddress  -> DELETE /api/users/addresses/:id
 */
import { apiRequest } from './apiClient';

export function updateProfile(changes) {
  return apiRequest('/api/users/profile', { method: 'PUT', body: changes });
}

export function changePassword(currentPassword, newPassword) {
  return apiRequest('/api/users/password', { method: 'PUT', body: { currentPassword, newPassword } });
}

export function getAddresses() {
  return apiRequest('/api/users/addresses');
}

export function addAddress(address) {
  return apiRequest('/api/users/addresses', { method: 'POST', body: address });
}

export function updateAddress(id, changes) {
  return apiRequest(`/api/users/addresses/${encodeURIComponent(id)}`, { method: 'PUT', body: changes });
}

export function deleteAddress(id) {
  return apiRequest(`/api/users/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
