/**
 * cartService - saved-cart calls for signed-in users (Student 3).
 *
 * Guests keep their cart in the browser only (see context/CartContext.jsx).
 * Phase 3: fetch() calls through the shared apiClient, which sends the saved
 * sign-in token as "Authorization: Bearer <token>" (backend/routes/student3.js):
 *   loadSavedCart()        -> GET  /api/cart
 *   saveCart(items)        -> POST /api/cart/persist   body: { items: [{ productId, quantity }] }
 *   mergeGuestCart(items)  -> POST /api/cart/merge     body: { items: [{ productId, quantity }] }
 * Every call answers { cart: { items, updatedAt }, adjustments }.
 */
import { apiRequest } from './apiClient';

// Only ids and quantities go to the server; it looks up prices and stock itself
const toPayload = (items) => items.map(({ productId, quantity }) => ({ productId, quantity }));

export function loadSavedCart() {
  return apiRequest('/api/cart');
}

export function saveCart(items) {
  return apiRequest('/api/cart/persist', { method: 'POST', body: { items: toPayload(items) } });
}

export function mergeGuestCart(items) {
  return apiRequest('/api/cart/merge', { method: 'POST', body: { items: toPayload(items) } });
}
