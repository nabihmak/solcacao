/**
 * orders.js - Checkout and order history API (Student 3).
 *
 *   POST /api/orders              place an order from the cart
 *   GET  /api/orders              the signed-in user's orders, newest first
 *   GET  /api/orders/:reference   one of the signed-in user's orders
 *
 * POST body:
 *   {
 *     items: [{ productId, quantity }],                  // the cart (ids and quantities only)
 *     shipping: { fullName, phone?, street, city, state?, postalCode, country },
 *     shippingMethod: 'standard' | 'express',
 *     paymentMethod: 'payOnDelivery',
 *     expectedTotal?: number                             // the total the shopper saw
 *   }
 *
 * Rules on the server (the browser is never trusted with money or stock):
 *  - prices come from the Product collection, stock from Inventory
 *  - stock is taken with one conditional update per product ("only if enough is left"),
 *    and given back if any later step fails, so two shoppers cannot buy the same last bar
 *  - if a product is gone, sold out or short, nothing is charged: 409 with what changed
 *  - if the total differs from expectedTotal (a price changed), 409 with the new total
 *  - after the order is saved, the user's saved cart is emptied
 *
 * Mount in server.js:  app.use('/api/orders', makeOrdersRouter());
 * Uses Student 1's protect middleware (JWT), so req.user is the signed-in user.
 */
import crypto from 'node:crypto';
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Cart, MAX_QTY_PER_ITEM } from '../models/Cart.js';
import { Order, SHIPPING_METHODS, PAYMENT_METHODS } from '../models/Order.js';
import { apiError, validateCartItems, withInventory } from './student3.js';

/* ------------------------------------------------------------------ */
/* Pricing (keep in step with client/src/utils/checkout.js)            */
/* ------------------------------------------------------------------ */

export const SHIPPING_RATES = { standard: 5.95, express: 14.95 };
export const FREE_SHIPPING_FROM = 50; // standard shipping is free from this subtotal
export const TAX_RATE = 0.0825; // Texas sales tax

const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => cents / 100;

/** Subtotal, shipping, tax and total in dollars. Everything is added up in cents. */
export function calculateTotals(subtotal, shippingMethod) {
  const subtotalCents = toCents(subtotal);
  let shippingCents = toCents(SHIPPING_RATES[shippingMethod] ?? SHIPPING_RATES.standard);
  if (shippingMethod === 'standard' && subtotalCents >= toCents(FREE_SHIPPING_FROM)) shippingCents = 0;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotal: fromCents(subtotalCents),
    shippingCost: fromCents(shippingCents),
    tax: fromCents(taxCents),
    total: fromCents(subtotalCents + shippingCents + taxCents),
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

// Field errors use Student 1's translation keys, so the forms show them in EN or ES
const SHIPPING_FIELDS = {
  fullName: { required: true, max: 100 },
  phone: { required: false, max: 30 },
  street: { required: true, max: 200 },
  city: { required: true, max: 100 },
  state: { required: false, max: 100 },
  postalCode: { required: true, max: 20 },
  country: { required: true, max: 100 },
};
const PHONE_PATTERN = /^[0-9+()\-.\s]{7,30}$/;

/** Returns clean checkout data, or throws 400 with field errors. */
export function validateCheckout(body = {}) {
  validateCartItems(body.items);
  const errors = [];
  if (!body.items.length) errors.push({ field: 'items', message: 'Your cart is empty' });

  const input = body.shipping && typeof body.shipping === 'object' ? body.shipping : {};
  const shipping = {};
  Object.entries(SHIPPING_FIELDS).forEach(([field, rule]) => {
    const value = typeof input[field] === 'string' ? input[field].trim() : '';
    if (rule.required && !value) errors.push({ field, message: 'auth.errors.required' });
    else if (value.length > rule.max) errors.push({ field, message: 'auth.errors.tooLong' });
    shipping[field] = value;
  });
  if (shipping.fullName && shipping.fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'auth.errors.required' });
  }
  if (shipping.phone && !PHONE_PATTERN.test(shipping.phone)) {
    errors.push({ field: 'phone', message: 'Enter a valid phone number' });
  }

  if (!SHIPPING_METHODS.includes(body.shippingMethod)) {
    errors.push({ field: 'shippingMethod', message: 'Choose a delivery option' });
  }
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Choose a payment option' });
  }
  let expectedTotal = null;
  if (body.expectedTotal !== undefined && body.expectedTotal !== null) {
    expectedTotal = Number(body.expectedTotal);
    if (!Number.isFinite(expectedTotal) || expectedTotal < 0) {
      errors.push({ field: 'expectedTotal', message: 'expectedTotal must be a number' });
    }
  }
  if (errors.length) throw apiError(400, 'Validation failed', errors);

  // Combine duplicate lines of the same product
  const combined = new Map();
  body.items.forEach(({ productId, quantity }) => combined.set(productId, (combined.get(productId) || 0) + quantity));
  const items = [...combined].map(([productId, quantity]) => ({ productId, quantity }));

  return { items, shipping, shippingMethod: body.shippingMethod, paymentMethod: body.paymentMethod, expectedTotal };
}

/**
 * Compares the order with the catalog. Unlike the cart, checkout never changes a
 * quantity by itself: it reports the problems and the shopper decides.
 */
export function findStockProblems(items, catalogById) {
  const problems = [];
  items.forEach(({ productId, quantity }) => {
    const product = catalogById.get(productId);
    if (!product) problems.push({ field: 'items', productId, reason: 'unavailable', message: 'Product no longer available' });
    else if (!product.inStock) problems.push({ field: 'items', productId, reason: 'outOfStock', message: 'Out of stock' });
    else if (quantity > Math.min(product.stock, MAX_QTY_PER_ITEM)) {
      problems.push({
        field: 'items',
        productId,
        reason: 'limited',
        quantity: Math.min(product.stock, MAX_QTY_PER_ITEM),
        message: `Only ${Math.min(product.stock, MAX_QTY_PER_ITEM)} left`,
      });
    }
  });
  return problems;
}

/* ------------------------------------------------------------------ */
/* Stock and references                                                */
/* ------------------------------------------------------------------ */

/**
 * Takes the stock for every line, one product at a time. Each update only succeeds
 * when enough is left, so it is safe when two orders arrive together. If one line
 * fails, the lines already taken are given back. Returns the line that failed, or null.
 */
async function reserveStock(items) {
  const taken = [];
  for (const { productId, quantity } of items) {
    const result = await Inventory.updateOne(
      { product: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(taken);
      return productId;
    }
    taken.push({ productId, quantity });
  }
  return null;
}

async function releaseStock(items) {
  await Promise.all(
    items.map(({ productId, quantity }) => Inventory.updateOne({ product: productId }, { $inc: { stock: quantity } }))
  );
}

// SC-ORD-2026-7K3F9Q: year plus 6 random letters/digits (no 0/O/1/I to avoid mix-ups)
const REFERENCE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeReference(date = new Date()) {
  const bytes = crypto.randomBytes(6);
  const code = [...bytes].map((byte) => REFERENCE_CHARS[byte % REFERENCE_CHARS.length]).join('');
  return `SC-ORD-${date.getFullYear()}-${code}`;
}

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

function toOrder(doc) {
  return {
    _id: String(doc._id),
    reference: doc.reference,
    items: doc.items,
    itemCount: doc.items.reduce((sum, line) => sum + line.quantity, 0),
    shippingAddress: doc.shippingAddress,
    shippingMethod: doc.shippingMethod,
    paymentMethod: doc.paymentMethod,
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    tax: doc.tax,
    total: doc.total,
    currency: doc.currency,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

const userIdOf = (req) => String(req.user._id);

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

/** requireAuth defaults to Student 1's protect (JWT check). Tests pass a stand-in. */
export function makeOrdersRouter({ requireAuth = protect } = {}) {
  const router = Router();
  router.use(requireAuth);

  router.post('/', async (req, res) => {
    const checkout = validateCheckout(req.body || {});

    // 1. Current prices and stock
    const ids = checkout.items.map((line) => line.productId);
    const products = await withInventory(await Product.find({ _id: { $in: ids } }).lean());
    const catalog = new Map(products.map((p) => [p._id, p]));
    const problems = findStockProblems(checkout.items, catalog);
    if (problems.length) throw apiError(409, 'Some items in your cart changed', problems);

    // 2. Lines and totals from the database prices
    const lines = checkout.items.map(({ productId, quantity }) => {
      const p = catalog.get(productId);
      return {
        productId,
        sku: p.sku,
        slug: p.slug,
        name: { en: p.name?.en || '', es: p.name?.es || p.name?.en || '' },
        origin: p.origin,
        cacaoPct: p.cacaoPct,
        category: p.category,
        unitPrice: p.price,
        quantity,
        lineTotal: fromCents(toCents(p.price) * quantity),
      };
    });
    const subtotal = fromCents(lines.reduce((sum, line) => sum + toCents(line.lineTotal), 0));
    const totals = calculateTotals(subtotal, checkout.shippingMethod);
    if (checkout.expectedTotal !== null && toCents(checkout.expectedTotal) !== toCents(totals.total)) {
      throw apiError(409, 'Prices changed since you opened checkout', [
        { field: 'total', reason: 'priceChanged', total: totals.total, message: 'The total has changed' },
      ]);
    }

    // 3. Take the stock (another shopper may have bought it a moment ago)
    const failed = await reserveStock(checkout.items);
    if (failed) {
      const fresh = await withInventory(await Product.find({ _id: { $in: ids } }).lean());
      const again = findStockProblems(checkout.items, new Map(fresh.map((p) => [p._id, p])));
      throw apiError(409, 'Some items in your cart changed', again.length ? again : [
        { field: 'items', productId: failed, reason: 'outOfStock', message: 'Out of stock' },
      ]);
    }

    // 4. Save the order (give the stock back if that fails)
    let order;
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          order = await Order.create({
            reference: makeReference(),
            user: userIdOf(req),
            items: lines,
            shippingAddress: checkout.shipping,
            shippingMethod: checkout.shippingMethod,
            paymentMethod: checkout.paymentMethod,
            ...totals,
          });
          break;
        } catch (error) {
          if (error.code !== 11000 || attempt >= 2) throw error; // retry only a duplicate reference
        }
      }
    } catch (error) {
      await releaseStock(checkout.items);
      throw error;
    }

    // 5. The saved cart is now empty
    await Cart.updateOne({ user: userIdOf(req) }, { $set: { items: [] } });

    res.status(201).json({ order: toOrder(order.toObject()) });
  });

  router.get('/', async (req, res) => {
    const docs = await Order.find({ user: userIdOf(req) }).sort({ createdAt: -1 }).limit(50).lean();
    res.status(200).json({ orders: docs.map(toOrder) });
  });

  router.get('/:reference', async (req, res) => {
    const reference = String(req.params.reference).toUpperCase().slice(0, 40);
    // Another user's order answers 404, the same as one that does not exist
    const doc = await Order.findOne({ reference, user: userIdOf(req) }).lean();
    if (!doc) throw apiError(404, 'Order not found');
    res.status(200).json({ order: toOrder(doc) });
  });

  // JSON errors for this router: 400/401/404/409 with details, 500 without internals
  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ message: err.message, errors: err.errors || [] });
    }
    console.error('[orders]', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.', errors: [] });
  });

  return router;
}
