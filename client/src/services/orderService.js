/**
 * orderService - checkout and order history calls for signed-in users (Student 3).
 * fetch() through the shared apiClient (sends the sign-in token), see backend/routes/orders.js:
 *   placeOrder(order)     -> POST /api/orders              answers { order }
 *   getOrders()           -> GET  /api/orders              answers { orders }
 *   getOrder(reference)   -> GET  /api/orders/:reference   answers { order }
 * A 409 error means the cart or prices changed; error.errors says what changed.
 */
import { apiRequest } from './apiClient';

export function placeOrder({ items, shipping, shippingMethod, paymentMethod = 'payOnDelivery', expectedTotal }) {
  return apiRequest('/api/orders', {
    method: 'POST',
    body: {
      // Only ids and quantities: the server looks up the prices itself
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      shipping,
      shippingMethod,
      paymentMethod,
      expectedTotal,
    },
  });
}

export function getOrders() {
  return apiRequest('/api/orders');
}

export function getOrder(reference) {
  return apiRequest(`/api/orders/${encodeURIComponent(reference)}`);
}
