/**
 * productService - catalog calls (Student 3).
 *
 * Phase 2: answered by the in-browser mock (catalogMockApi.js).
 * Phase 3: each function becomes a fetch() call to the Express API:
 *   fetchProducts(query)   -> GET /api/products?search=&origin=Peru,Ecuador&minPct=70&sort=price_asc&page=1
 *   fetchProduct(slug)     -> GET /api/products/:slug
 * The response shape stays the same: { products, pagination, facets } and { product }.
 */
import * as catalogApi from './catalogMockApi';

export function fetchProducts(query) {
  return catalogApi.getProducts(query);
}

export function fetchProduct(slug) {
  return catalogApi.getProductBySlug(slug);
}
