/**
 * cartService - saved-cart calls for signed-in users (Student 3).
 *
 * Guests keep their cart in the browser only (see context/CartContext.jsx).
 * Phase 2: answered by the in-browser mock (catalogMockApi.js).
 * Phase 3: each function becomes a fetch() call with "Authorization: Bearer <token>":
 *   loadSavedCart()        -> GET  /api/cart
 *   saveCart(items)        -> POST /api/cart/persist   body: { items: [{ productId, quantity }] }
 *   mergeGuestCart(items)  -> POST /api/cart/merge     body: { items: [{ productId, quantity }] }
 * Every call answers { cart: { items, updatedAt }, adjustments }.
 */
import * as catalogApi from './catalogMockApi';
import { tokenStorage } from './tokenStorage';

const token = () => tokenStorage.get();

// Only ids and quantities go to the server; it looks up prices itself
const toPayload = (items) => items.map(({ productId, quantity }) => ({ productId, quantity }));

export function loadSavedCart() {
  return catalogApi.getCart(token());
}

export function saveCart(items) {
  return catalogApi.persistCart(token(), toPayload(items));
}

export function mergeGuestCart(items) {
  return catalogApi.mergeCart(token(), toPayload(items));
}
