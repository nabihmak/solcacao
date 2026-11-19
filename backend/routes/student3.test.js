/**
 * student3.test.js - tests for the catalog and cart API (Student 3).
 *
 * Unit tests run with no database:   node --test routes/student3.test.js
 * API tests also run when a test database is set, e.g.
 *   STUDENT3_TEST_MONGO=mongodb://127.0.0.1:27017/solcacao_test node --test routes/student3.test.js
 * (never point this at the team database: the API tests wipe their collections)
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import {
  parseProductQuery,
  buildProductFilter,
  validateCartItems,
  reconcileItems,
  makeStudent3Router,
  catalogBounds,
  clearCatalogBounds,
} from './student3.js';
import { Product, normalizeText } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Cart } from '../models/Cart.js';

/* ------------------------------ unit tests ------------------------------ */

describe('parseProductQuery', () => {
  test('uses defaults when the query is empty', () => {
    const f = parseProductQuery({});
    assert.equal(f.sort, 'featured');
    assert.equal(f.page, 1);
    assert.equal(f.limit, 9);
    assert.deepEqual(f.origins, []);
    assert.equal(f.inStock, false);
  });

  test('reads comma-separated origins and numbers', () => {
    const f = parseProductQuery({ origin: 'Peru, Ecuador', minPct: '70', maxPrice: '12.5', inStock: 'true' });
    assert.deepEqual(f.origins, ['Peru', 'Ecuador']);
    assert.equal(f.minPct, 70);
    assert.equal(f.maxPrice, 12.5);
    assert.equal(f.inStock, true);
  });

  test('rejects minPct greater than maxPct with 400', () => {
    assert.throws(() => parseProductQuery({ minPct: '90', maxPct: '50' }), (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.errors[0].field, 'minPct');
      return true;
    });
  });

  test('rejects an unknown sort, category, page and limit', () => {
    assert.throws(() => parseProductQuery({ sort: 'cheapest' }), { status: 400 });
    assert.throws(() => parseProductQuery({ category: 'cookies' }), { status: 400 });
    assert.throws(() => parseProductQuery({ page: '0' }), { status: 400 });
    assert.throws(() => parseProductQuery({ limit: '500' }), { status: 400 });
    assert.throws(() => parseProductQuery({ minPrice: 'abc' }), { status: 400 });
  });
});

describe('buildProductFilter', () => {
  test('builds ranges, origin list and accent-free search', () => {
    const f = parseProductQuery({ search: 'Café', origin: 'Peru', minPct: '70', maxPct: '85' });
    const filter = buildProductFilter(f);
    assert.deepEqual(filter.origin, { $in: ['Peru'] });
    assert.deepEqual(filter.cacaoPct, { $gte: 70, $lte: 85 });
    assert.equal(filter.$and[0].searchText.$regex, 'cafe');
  });

  test('skips its own filter for facet counts', () => {
    const f = parseProductQuery({ origin: 'Peru', category: 'bar' });
    assert.equal(buildProductFilter(f, { skip: 'origin' }).origin, undefined);
    assert.equal(buildProductFilter(f, { skip: 'category' }).category, undefined);
  });

  test('escapes regex characters in search', () => {
    const f = parseProductQuery({ search: 'a.*b' });
    assert.equal(buildProductFilter(f).$and[0].searchText.$regex, 'a\\.\\*b');
  });

  test('normalizeText strips accents', () => {
    assert.equal(normalizeText('Lúcuma CAFÉ'), 'lucuma cafe');
  });
});

describe('cart rules', () => {
  const catalog = new Map([
    ['p-1', { _id: 'p-1', stock: 10, inStock: true }],
    ['p-2', { _id: 'p-2', stock: 0, inStock: false }],
    ['p-3', { _id: 'p-3', stock: 500, inStock: true }],
  ]);

  test('validateCartItems rejects bad bodies', () => {
    assert.throws(() => validateCartItems('nope'), { status: 400 });
    assert.throws(() => validateCartItems([{ productId: 'p-1', quantity: 0 }]), { status: 400 });
    assert.throws(() => validateCartItems([{ productId: '', quantity: 1 }]), { status: 400 });
    assert.throws(() => validateCartItems(Array.from({ length: 51 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 }))), {
      status: 400,
    });
    assert.doesNotThrow(() => validateCartItems([{ productId: 'p-1', quantity: 2 }]));
  });

  test('reconcileItems combines duplicates and caps at stock', () => {
    const { clean, adjustments } = reconcileItems(
      [{ productId: 'p-1', quantity: 6 }, { productId: 'p-1', quantity: 6 }],
      catalog
    );
    assert.deepEqual(clean, [{ productId: 'p-1', quantity: 10 }]);
    assert.deepEqual(adjustments, [{ productId: 'p-1', reason: 'limited', quantity: 10 }]);
  });

  test('reconcileItems drops unknown and sold-out products and caps at 99', () => {
    const { clean, adjustments } = reconcileItems(
      [{ productId: 'nope', quantity: 1 }, { productId: 'p-2', quantity: 1 }, { productId: 'p-3', quantity: 120 }],
      catalog
    );
    assert.deepEqual(clean, [{ productId: 'p-3', quantity: 99 }]);
    assert.deepEqual(adjustments.map((a) => a.reason), ['unavailable', 'outOfStock', 'limited']);
  });

});

/* --------------------------- API tests (MongoDB) --------------------------- */

const TEST_DB = process.env.STUDENT3_TEST_MONGO;

describe('API with a test database', { skip: !TEST_DB && 'set STUDENT3_TEST_MONGO to run' }, () => {
  let server;
  let base;
  const auth = { 'content-type': 'application/json', 'x-test-user': 'test-user-1' };

  const product = (id, overrides) => ({
    _id: id,
    sku: `SKU-${id}`,
    slug: `slug-${id}`,
    name: { en: `Bar ${id}`, es: `Barra ${id}` },
    category: 'bar',
    origin: 'Peru',
    cacaoPct: 70,
    price: 10,
    ...overrides,
  });

  before(async () => {
    await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 5000 });
    await Promise.all([Product.deleteMany({}), Inventory.deleteMany({}), Cart.deleteMany({})]);
    await Product.create([
      product('p-1', { origin: 'Peru', cacaoPct: 70, price: 9, featuredRank: 2, tastingNotes: { en: ['Café'], es: ['Café'] } }),
      product('p-2', { origin: 'Ecuador', cacaoPct: 85, price: 12, featuredRank: 1 }),
      product('p-3', { origin: 'Peru', cacaoPct: 60, price: 15, category: 'truffles', featuredRank: 3 }),
    ]);
    await Inventory.create([
      { product: 'p-1', stock: 5 },
      { product: 'p-2', stock: 0 },
      { product: 'p-3', stock: 40 },
    ]);

    const app = express();
    app.use(express.json());
    // Stand-in for Student 1's protect: the user id comes from a test header
    const fakeProtect = (req, res, next) => {
      const id = req.get('x-test-user');
      if (!id) return res.status(401).json({ message: 'Not authorized: please sign in again' });
      req.user = { _id: id };
      return next();
    };
    clearCatalogBounds(); // start without the 5-minute catalog-limits cache
    app.use('/api', makeStudent3Router({ requireAuth: fakeProtect }));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    server?.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  test('GET /products returns products, pagination and facets', async () => {
    const res = await fetch(`${base}/products`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.products.map((p) => p._id), ['p-2', 'p-1', 'p-3']); // featured order
    assert.equal(body.pagination.total, 3);
    assert.equal(body.products[0].inStock, false);
    assert.equal(body.products[1].lowStock, true);
    assert.deepEqual(body.facets.origins, [{ value: 'Ecuador', count: 1 }, { value: 'Peru', count: 2 }]);
  });

  test('GET /products filters, sorts and searches', async () => {
    let body = await (await fetch(`${base}/products?origin=Peru&sort=price_desc`)).json();
    assert.deepEqual(body.products.map((p) => p._id), ['p-3', 'p-1']);
    body = await (await fetch(`${base}/products?inStock=true&minPct=65`)).json();
    assert.deepEqual(body.products.map((p) => p._id), ['p-1']);
    body = await (await fetch(`${base}/products?search=cafe`)).json();
    assert.deepEqual(body.products.map((p) => p._id), ['p-1']);
  });

  test('GET /products can be cached by the browser for a minute (Phase 4)', async () => {
    const res = await fetch(`${base}/products`);
    assert.equal(res.headers.get('cache-control'), 'public, max-age=60');
  });

  test('catalog limits are read once and reused for 5 minutes (Phase 4)', async () => {
    clearCatalogBounds();
    const first = await catalogBounds(1_000);
    await Product.create(product('p-9', { origin: 'Ghana' }));
    const cached = await catalogBounds(1_000 + 60_000); // 1 minute later: same answer
    assert.deepEqual([...cached.origins].sort(), [...first.origins].sort());
    const fresh = await catalogBounds(1_000 + 6 * 60_000); // 6 minutes later: read again
    assert.ok(fresh.origins.includes('Ghana'));
    await Product.deleteOne({ _id: 'p-9' });
    clearCatalogBounds();
  });

  test('GET /products returns 400 for invalid query', async () => {
    const res = await fetch(`${base}/products?minPct=90&maxPct=10`);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).errors[0].field, 'minPct');
  });

  test('GET /products/:slug returns 200 and 404', async () => {
    assert.equal((await fetch(`${base}/products/slug-p-1`)).status, 200);
    assert.equal((await fetch(`${base}/products/does-not-exist`)).status, 404);
  });

  test('cart routes require sign-in', async () => {
    assert.equal((await fetch(`${base}/cart`)).status, 401);
  });

  test('persist saves a reconciled cart and merge adds the guest cart', async () => {
    let res = await fetch(`${base}/cart/persist`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ items: [{ productId: 'p-1', quantity: 3 }, { productId: 'p-2', quantity: 1 }] }),
    });
    assert.equal(res.status, 200);
    let body = await res.json();
    assert.deepEqual(body.cart.items.map(({ productId, quantity }) => ({ productId, quantity })), [
      { productId: 'p-1', quantity: 3 },
    ]);
    assert.equal(body.cart.items[0].product.price, 9);
    assert.deepEqual(body.adjustments, [{ productId: 'p-2', reason: 'outOfStock' }]);

    res = await fetch(`${base}/cart/merge`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ items: [{ productId: 'p-1', quantity: 4 }, { productId: 'p-3', quantity: 2 }] }),
    });
    body = await res.json();
    assert.deepEqual(body.cart.items.map(({ productId, quantity }) => ({ productId, quantity })), [
      { productId: 'p-1', quantity: 5 },
      { productId: 'p-3', quantity: 2 },
    ]);
    assert.deepEqual(body.adjustments, [{ productId: 'p-1', reason: 'limited', quantity: 5 }]);

    body = await (await fetch(`${base}/cart`, { headers: auth })).json();
    assert.equal(body.cart.items.length, 2);
  });

  test('persist returns 400 for a bad body', async () => {
    const res = await fetch(`${base}/cart/persist`, { method: 'POST', headers: auth, body: JSON.stringify({ items: 'x' }) });
    assert.equal(res.status, 400);
  });
});
