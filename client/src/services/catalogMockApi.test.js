/**
 * Unit tests for the Phase 2 catalog and cart endpoints (run with: npm test).
 * They check that the mock answers like the planned REST API.
 */
import { beforeEach, describe, expect, test } from 'vitest';
import * as catalog from './catalogMockApi';
import * as authApi from './mockApi';

async function failure(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
}

describe('GET /api/products', () => {
  test('returns the first page with pagination and filter options', async () => {
    const result = await catalog.getProducts({ limit: 9 });
    expect(result.products).toHaveLength(9);
    expect(result.pagination).toEqual({ page: 1, limit: 9, total: 18, totalPages: 2 });
    expect(result.facets.origins.map((o) => o.value)).toContain('Peru');
    expect(result.products[0]).toHaveProperty('stock');
  });

  test('filters by several origins and a cacao range', async () => {
    const { products } = await catalog.getProducts({ origin: 'Peru,Ecuador', minPct: 70, maxPct: 85, limit: 48 });
    expect(products.length).toBeGreaterThan(0);
    products.forEach((p) => {
      expect(['Peru', 'Ecuador']).toContain(p.origin);
      expect(p.cacaoPct).toBeGreaterThanOrEqual(70);
      expect(p.cacaoPct).toBeLessThanOrEqual(85);
    });
  });

  test('search ignores accents and works in both languages', async () => {
    const lucuma = await catalog.getProducts({ search: 'lucuma' }); // stored as "Lúcuma"
    expect(lucuma.products.map((p) => p.slug)).toContain('andean-truffle-box-12');
    const trufas = await catalog.getProducts({ search: 'trufas' }); // Spanish name
    expect(trufas.pagination.total).toBe(3);
  });

  test('sorts by price and by cacao percentage', async () => {
    const cheap = await catalog.getProducts({ sort: 'price_asc', limit: 48 });
    const prices = cheap.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const dark = await catalog.getProducts({ sort: 'pct_desc', limit: 1 });
    expect(dark.products[0].cacaoPct).toBe(100);
  });

  test('origin counts ignore the origin filter itself', async () => {
    const { facets, pagination } = await catalog.getProducts({ origin: 'Ghana' });
    expect(pagination.total).toBe(1);
    expect(facets.origins.find((o) => o.value === 'Peru').count).toBe(4);
  });

  test('inStock hides sold-out products', async () => {
    const { products } = await catalog.getProducts({ inStock: 'true', limit: 48 });
    expect(products.every((p) => p.inStock)).toBe(true);
    expect(products).toHaveLength(17);
  });

  test('a page past the end returns the last page', async () => {
    const { pagination } = await catalog.getProducts({ page: 99, limit: 9 });
    expect(pagination.page).toBe(2);
  });

  test('bad query values -> 400 with field errors', async () => {
    const error = await failure(catalog.getProducts({ minPct: 'abc', sort: 'random', page: 0 }));
    expect(error.status).toBe(400);
    expect(error.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['minPct', 'sort', 'page']));
  });
});

describe('GET /api/products/:slug', () => {
  test('returns one product with stock', async () => {
    const { product } = await catalog.getProductBySlug('chuao-68');
    expect(product).toMatchObject({ origin: 'Venezuela', stock: 3, lowStock: true });
  });

  test('unknown slug -> 404', async () => {
    expect((await failure(catalog.getProductBySlug('nope'))).status).toBe(404);
  });
});

describe('cart persistence and guest merge', () => {
  let token;
  beforeEach(async () => {
    authApi.resetMockDb();
    catalog.resetMockCarts();
    ({ token } = await authApi.login('ana@example.com', 'Cacao2026'));
  });

  test('a new account starts with an empty cart', async () => {
    const { cart } = await catalog.getCart(token);
    expect(cart.items).toEqual([]);
  });

  test('persist saves the cart and getCart returns it with product details', async () => {
    await catalog.persistCart(token, [{ productId: 'p-001', quantity: 2 }]);
    const { cart } = await catalog.getCart(token);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: 'p-001', quantity: 2, product: { slug: 'piura-white-70' } });
  });

  test('merge adds the guest cart to the saved cart', async () => {
    await catalog.persistCart(token, [{ productId: 'p-001', quantity: 2 }]);
    const { cart } = await catalog.mergeCart(token, [
      { productId: 'p-001', quantity: 1 },
      { productId: 'p-003', quantity: 4 },
    ]);
    const quantities = Object.fromEntries(cart.items.map((line) => [line.productId, line.quantity]));
    expect(quantities).toEqual({ 'p-001': 3, 'p-003': 4 });
  });

  test('quantities are limited to stock; sold-out and unknown items are removed', async () => {
    const { cart, adjustments } = await catalog.persistCart(token, [
      { productId: 'p-008', quantity: 10 }, // only 3 in stock
      { productId: 'p-011', quantity: 1 }, // sold out
      { productId: 'p-999', quantity: 1 }, // does not exist
    ]);
    expect(cart.items).toEqual([expect.objectContaining({ productId: 'p-008', quantity: 3 })]);
    expect(adjustments.map((a) => a.reason).sort()).toEqual(['limited', 'outOfStock', 'unavailable']);
  });

  test('malformed items -> 400', async () => {
    expect((await failure(catalog.persistCart(token, 'nope'))).status).toBe(400);
    expect((await failure(catalog.persistCart(token, [{ productId: 'p-001', quantity: 0 }]))).status).toBe(400);
  });

  test('cart calls need a valid token -> 401', async () => {
    expect((await failure(catalog.persistCart('fake', []))).status).toBe(401);
    expect((await failure(catalog.getCart(null))).status).toBe(401);
  });

  test('each account has its own cart', async () => {
    await catalog.persistCart(token, [{ productId: 'p-001', quantity: 1 }]);
    const other = await authApi.login('carlos@grandhotel.com', 'Hotel2026');
    expect((await catalog.getCart(other.token)).cart.items).toEqual([]);
  });
});
