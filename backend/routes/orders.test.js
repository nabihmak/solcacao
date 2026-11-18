/**
 * Tests for the checkout and order API (Student 3).
 *   node --test routes/orders.test.js
 * API tests also run when a test database is set, e.g.
 *   STUDENT3_TEST_MONGO=mongodb://127.0.0.1:27017/solcacao_test node --test routes/orders.test.js
 * (never point this at the team database: the API tests wipe their collections)
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import {
  calculateTotals,
  validateCheckout,
  findStockProblems,
  makeReference,
  makeOrdersRouter,
} from './orders.js';
import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';

const SHIPPING = {
  fullName: 'Ana López',
  phone: '+1 (817) 555-0100',
  street: '701 S Nedderman Dr',
  city: 'Arlington',
  state: 'TX',
  postalCode: '76019',
  country: 'United States',
};

const checkoutBody = (overrides = {}) => ({
  items: [{ productId: 'p-1', quantity: 2 }],
  shipping: SHIPPING,
  shippingMethod: 'standard',
  paymentMethod: 'payOnDelivery',
  ...overrides,
});

/* ------------------------------ unit tests ------------------------------ */

describe('calculateTotals', () => {
  test('adds standard shipping and 8.25% tax under $50', () => {
    assert.deepEqual(calculateTotals(19, 'standard'), { subtotal: 19, shippingCost: 5.95, tax: 1.57, total: 26.52 });
  });

  test('standard shipping is free from $50', () => {
    assert.equal(calculateTotals(50, 'standard').shippingCost, 0);
    assert.equal(calculateTotals(49.99, 'standard').shippingCost, 5.95);
  });

  test('express shipping is always charged', () => {
    assert.equal(calculateTotals(80, 'express').shippingCost, 14.95);
  });

  test('works in cents, so there are no floating-point leftovers', () => {
    const totals = calculateTotals(0.1 + 0.2, 'express');
    assert.equal(totals.subtotal, 0.3);
    assert.equal(totals.total, 15.27);
  });
});

describe('validateCheckout', () => {
  test('returns clean data and combines duplicate lines', () => {
    const clean = validateCheckout(
      checkoutBody({
        items: [
          { productId: 'p-1', quantity: 1 },
          { productId: 'p-1', quantity: 2 },
        ],
        shipping: { ...SHIPPING, city: '  Arlington  ' },
      })
    );
    assert.deepEqual(clean.items, [{ productId: 'p-1', quantity: 3 }]);
    assert.equal(clean.shipping.city, 'Arlington');
    assert.equal(clean.expectedTotal, null);
  });

  test('lists every missing or invalid field', () => {
    assert.throws(
      () => validateCheckout(checkoutBody({ shipping: { fullName: 'A', phone: 'abc' }, shippingMethod: 'drone', paymentMethod: 'card' })),
      (error) => {
        assert.equal(error.status, 400);
        const fields = error.errors.map((e) => e.field);
        for (const f of ['street', 'city', 'postalCode', 'country', 'fullName', 'phone', 'shippingMethod', 'paymentMethod']) {
          assert.ok(fields.includes(f), `missing error for ${f}`);
        }
        return true;
      }
    );
  });

  test('rejects an empty cart and bad items', () => {
    assert.throws(() => validateCheckout(checkoutBody({ items: [] })), { status: 400 });
    assert.throws(() => validateCheckout(checkoutBody({ items: [{ productId: 'p-1', quantity: 0 }] })), { status: 400 });
    assert.throws(() => validateCheckout(checkoutBody({ items: 'p-1' })), { status: 400 });
  });

  test('state and phone are optional', () => {
    const clean = validateCheckout(checkoutBody({ shipping: { ...SHIPPING, state: '', phone: '' } }));
    assert.equal(clean.shipping.state, '');
  });
});

describe('findStockProblems', () => {
  const catalog = new Map([
    ['in', { _id: 'in', stock: 10, inStock: true }],
    ['short', { _id: 'short', stock: 2, inStock: true }],
    ['none', { _id: 'none', stock: 0, inStock: false }],
  ]);

  test('reports unavailable, sold-out and short lines without changing them', () => {
    const problems = findStockProblems(
      [
        { productId: 'in', quantity: 3 },
        { productId: 'short', quantity: 5 },
        { productId: 'none', quantity: 1 },
        { productId: 'gone', quantity: 1 },
      ],
      catalog
    );
    assert.deepEqual(
      problems.map(({ productId, reason, quantity }) => ({ productId, reason, quantity })),
      [
        { productId: 'short', reason: 'limited', quantity: 2 },
        { productId: 'none', reason: 'outOfStock', quantity: undefined },
        { productId: 'gone', reason: 'unavailable', quantity: undefined },
      ]
    );
  });
});

describe('makeReference', () => {
  test('has the year and a 6-character code', () => {
    assert.match(makeReference(new Date('2026-11-18')), /^SC-ORD-2026-[A-HJ-NP-Z2-9]{6}$/);
  });
});

/* --------------------------- API tests (MongoDB) --------------------------- */

const TEST_DB = process.env.STUDENT3_TEST_MONGO;

describe('Orders API with a test database', { skip: !TEST_DB && 'set STUDENT3_TEST_MONGO to run' }, () => {
  let server;
  let base;
  const as = (userId) => ({ 'content-type': 'application/json', 'x-test-user': userId });
  const post = (body, userId = 'user-1') =>
    fetch(`${base}/orders`, { method: 'POST', headers: as(userId), body: JSON.stringify(body) });

  const product = (id, overrides) => ({
    _id: id,
    sku: `SKU-${id}`,
    slug: `slug-${id}`,
    name: { en: `Bar ${id}`, es: `Barra ${id}` },
    category: 'bar',
    origin: 'Peru',
    cacaoPct: 70,
    price: 9.5,
    ...overrides,
  });

  before(async () => {
    await mongoose.connect(TEST_DB);
    const app = express();
    app.use(express.json());
    const fakeProtect = (req, res, next) => {
      const id = req.get('x-test-user');
      if (!id) return res.status(401).json({ message: 'Not authorized: please sign in again' });
      req.user = { _id: id };
      return next();
    };
    app.use('/api/orders', makeOrdersRouter({ requireAuth: fakeProtect }));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
  });

  beforeEach(async () => {
    await Promise.all([Product.deleteMany({}), Inventory.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
    await Product.create([product('p-1'), product('p-2', { price: 32 })]);
    await Inventory.create([
      { product: 'p-1', stock: 5 },
      { product: 'p-2', stock: 1 },
    ]);
  });

  after(async () => {
    server?.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  test('needs a signed-in user', async () => {
    const res = await fetch(`${base}/orders`);
    assert.equal(res.status, 401);
  });

  test('places an order with database prices, takes the stock and empties the saved cart', async () => {
    await Cart.create({ user: 'user-1', items: [{ productId: 'p-1', quantity: 2 }] });
    const res = await post(checkoutBody({ items: [{ productId: 'p-1', quantity: 2 }], expectedTotal: 26.52 }));
    assert.equal(res.status, 201);
    const { order } = await res.json();
    assert.match(order.reference, /^SC-ORD-\d{4}-/);
    assert.equal(order.subtotal, 19);
    assert.equal(order.total, 26.52);
    assert.equal(order.items[0].name.en, 'Bar p-1');
    assert.equal(order.status, 'placed');

    assert.equal((await Inventory.findOne({ product: 'p-1' })).stock, 3);
    assert.equal((await Cart.findOne({ user: 'user-1' })).items.length, 0);
  });

  test('ignores any price sent by the browser', async () => {
    const res = await post(checkoutBody({ items: [{ productId: 'p-1', quantity: 1, price: 0.01 }] }));
    const { order } = await res.json();
    assert.equal(order.items[0].unitPrice, 9.5);
  });

  test('returns 409 and takes no stock when an item is short', async () => {
    const res = await post(
      checkoutBody({
        items: [
          { productId: 'p-1', quantity: 1 },
          { productId: 'p-2', quantity: 3 },
        ],
      })
    );
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.deepEqual(body.errors.map((e) => [e.productId, e.reason, e.quantity]), [['p-2', 'limited', 1]]);
    assert.equal((await Inventory.findOne({ product: 'p-1' })).stock, 5);
    assert.equal(await Order.countDocuments(), 0);
  });

  test('returns 409 with the new total when prices changed', async () => {
    const res = await post(checkoutBody({ expectedTotal: 10 }));
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.errors[0].reason, 'priceChanged');
    assert.equal(body.errors[0].total, 26.52);
  });

  test('only one of two shoppers gets the last bar', async () => {
    const body = checkoutBody({ items: [{ productId: 'p-2', quantity: 1 }] });
    const results = await Promise.all([post(body, 'user-1'), post(body, 'user-2')]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal((await Inventory.findOne({ product: 'p-2' })).stock, 0);
  });

  test('lists and opens only the user’s own orders', async () => {
    const { order } = await (await post(checkoutBody())).json();

    const mine = await (await fetch(`${base}/orders`, { headers: as('user-1') })).json();
    assert.deepEqual(mine.orders.map((o) => o.reference), [order.reference]);

    const one = await fetch(`${base}/orders/${order.reference.toLowerCase()}`, { headers: as('user-1') });
    assert.equal(one.status, 200);

    const other = await fetch(`${base}/orders/${order.reference}`, { headers: as('user-2') });
    assert.equal(other.status, 404);
    const otherList = await (await fetch(`${base}/orders`, { headers: as('user-2') })).json();
    assert.equal(otherList.orders.length, 0);
  });

  test('returns 400 with field errors for a bad address', async () => {
    const res = await post(checkoutBody({ shipping: { ...SHIPPING, street: '' } }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body.errors, [{ field: 'street', message: 'auth.errors.required' }]);
  });
});
