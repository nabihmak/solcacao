/**
 * productService - catalog calls (Student 3).
 *
 * Phase 3: fetch() calls to the Express API (backend/routes/student3.js),
 * through the shared apiClient (Student 1):
 *   fetchProducts(query)   -> GET /api/products?search=&origin=Peru,Ecuador&minPct=70&sort=price_asc&page=1
 *   fetchProduct(slug)     -> GET /api/products/:slug
 * The response shape is the same as Phase 2: { products, pagination, facets } and { product }.
 */
import { apiRequest } from './apiClient';

// { sort: 'price_asc', origin: 'Peru,Ecuador' } -> "?sort=price_asc&origin=Peru%2CEcuador" (empty values skipped)
export function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : '';
}

// The catalog is public, so no sign-in token is sent
export function fetchProducts(query = {}) {
  return apiRequest(`/api/products${buildQueryString(query)}`, { token: null });
}

export function fetchProduct(slug) {
  return apiRequest(`/api/products/${encodeURIComponent(slug)}`, { token: null });
}
