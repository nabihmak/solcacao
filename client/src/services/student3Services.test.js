/**
 * Tests for the Student 3 fetch() services (productService, cartService).
 * fetch is replaced with a fake, so no server is needed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildQueryString, fetchProducts, fetchProduct } from './productService';
import { loadSavedCart, saveCart, mergeGuestCart } from './cartService';
import { tokenStorage } from './tokenStorage';

const ok = (data) => ({ ok: true, status: 200, json: async () => data });
const fail = (status, data) => ({ ok: false, status, json: async () => data });

let mockFetch;
beforeEach(() => {
  mockFetch = vi.fn().mockResolvedValue(ok({}));
  vi.stubGlobal('fetch', mockFetch);
});
afterEach(() => {
  vi.unstubAllGlobals();
  tokenStorage.clear();
});

describe('buildQueryString', () => {
  it('skips empty values and encodes the rest', () => {
    expect(buildQueryString({ search: 'café', origin: 'Peru,Ecuador', minPct: 70, maxPct: null, category: '' })).toBe(
      '?search=caf%C3%A9&origin=Peru%2CEcuador&minPct=70'
    );
    expect(buildQueryString({})).toBe('');
  });
});

describe('productService', () => {
  it('fetchProducts calls GET /api/products with the filters and no token', async () => {
    tokenStorage.set('abc123');
    mockFetch.mockResolvedValue(ok({ products: [], pagination: {}, facets: {} }));
    const data = await fetchProducts({ sort: 'price_asc', page: 2, inStock: true });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/products?sort=price_asc&page=2&inStock=true');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBeUndefined();
    expect(data.products).toEqual([]);
  });

  it('fetchProduct throws with status 404 for an unknown slug', async () => {
    mockFetch.mockResolvedValue(fail(404, { message: 'Product not found', errors: [] }));
    await expect(fetchProduct('nope')).rejects.toMatchObject({ status: 404, message: 'Product not found' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/products/nope');
  });

  it('passes field errors through on 400', async () => {
    const errors = [{ field: 'minPct', message: 'minPct cannot be greater than maxPct' }];
    mockFetch.mockResolvedValue(fail(400, { message: 'Invalid query parameters', errors }));
    await expect(fetchProducts({ minPct: 90, maxPct: 10 })).rejects.toMatchObject({ status: 400, errors });
  });
});

describe('cartService', () => {
  it('sends the sign-in token and only ids and quantities', async () => {
    tokenStorage.set('abc123');
    await saveCart([{ productId: 'p-001', quantity: 2, product: { price: 9.5 } }]);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/cart/persist');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer abc123');
    expect(JSON.parse(init.body)).toEqual({ items: [{ productId: 'p-001', quantity: 2 }] });
  });

  it('loadSavedCart and mergeGuestCart call the right endpoints', async () => {
    await loadSavedCart();
    await mergeGuestCart([{ productId: 'p-002', quantity: 1 }]);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/cart');
    expect(mockFetch.mock.calls[1][0]).toBe('/api/cart/merge');
    expect(mockFetch.mock.calls[1][1].method).toBe('POST');
  });

  it('throws status 401 when not signed in', async () => {
    mockFetch.mockResolvedValue(fail(401, { message: 'Not authorized: please sign in again' }));
    await expect(loadSavedCart()).rejects.toMatchObject({ status: 401 });
  });

  it('turns a network failure into status 0', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(loadSavedCart()).rejects.toMatchObject({ status: 0 });
  });
});
