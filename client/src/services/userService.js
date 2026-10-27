/**
 * userService - profile management calls (signed-in users only).
 *
 * Phase 2: answered by the in-browser mock data layer (mockApi.js).
 * Phase 3: each function becomes a fetch() call with "Authorization: Bearer <token>":
 *   updateProfile  -> PUT    /api/users/profile
 *   changePassword -> PUT    /api/users/password
 *   getAddresses   -> GET    /api/users/addresses
 *   addAddress     -> POST   /api/users/addresses
 *   updateAddress  -> PUT    /api/users/addresses/:id
 *   deleteAddress  -> DELETE /api/users/addresses/:id
 */
import * as mockApi from './mockApi';
import { tokenStorage } from './tokenStorage';

const token = () => tokenStorage.get();

export function updateProfile(changes) {
  return mockApi.updateProfile(token(), changes);
}

export function changePassword(currentPassword, newPassword) {
  return mockApi.changePassword(token(), currentPassword, newPassword);
}

export function getAddresses() {
  return mockApi.getAddresses(token());
}

export function addAddress(address) {
  return mockApi.addAddress(token(), address);
}

export function updateAddress(id, changes) {
  return mockApi.updateAddress(token(), id, changes);
}

export function deleteAddress(id) {
  return mockApi.deleteAddress(token(), id);
}
