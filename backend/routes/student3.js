/**
 * student3.js - Catalog, search and saved-cart API (Student 3).
 *
 *   GET  /api/products            search, filters, sort, pagination, facets
 *   GET  /api/products/:slug      one product
 *   GET  /api/cart                signed-in user's saved cart
 *   POST /api/cart/persist        replace the saved cart     body: { items: [{ productId, quantity }] }
 *   POST /api/cart/merge          add the guest cart to it   body: { items: [{ productId, quantity }] }
 *
 * Response shapes match the Phase 2 mock (client/src/services/catalogMockApi.js),
 * so the React pages keep working when the services switch to fetch().
 * Mount in server.js:  app.use('/api', makeStudent3Router());
 * Cart routes use Student 1's protect middleware (JWT), so req.user is the signed-in user.
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { Product, CATEGORIES, normalizeText } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { Cart, MAX_QTY_PER_ITEM, MAX_CART_LINES } from '../models/Cart.js';

export const SORT_OPTIONS = ['featured', 'price_asc', 'price_desc', 'pct_desc', 'pct_asc', 'newest'];
export const DEFAULT_PAGE_SIZE = 9;
export const MAX_PAGE_SIZE = 48;

export function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

/* ------------------------------------------------------------------ */
/* Query validation                                                    */
/* ------------------------------------------------------------------ */

function toList(value) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((part) => part.trim()).filter(Boolean);
}

// Returns a number, null when empty, or NaN when it is not a number
function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

/** Reads req.query and returns clean filters, or throws 400 with field errors. */
export function parseProductQuery(query = {}) {
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  const search = String(query.search ?? '').trim();
  if (search.length > 100) fail('search', 'Search text must be 100 characters or fewer');

  const origins = toList(query.origin);
  if (origins.length > 20) fail('origin', 'Too many origins');

  const category = String(query.category ?? '').trim();
  if (category && !CATEGORIES.includes(category)) fail('category', 'Unknown category');

  const minPct = toNumber(query.minPct);
  const maxPct = toNumber(query.maxPct);
  [['minPct', minPct], ['maxPct', maxPct]].forEach(([field, value]) => {
    if (Number.isNaN(value) || (value !== null && (value < 0 || value > 100))) {
      fail(field, 'Cacao percentage must be a number from 0 to 100');
    }
  });
  if (minPct !== null && maxPct !== null && minPct > maxPct) fail('minPct', 'minPct cannot be greater than maxPct');

  const minPrice = toNumber(query.minPrice);
  const maxPrice = toNumber(query.maxPrice);
  [['minPrice', minPrice], ['maxPrice', maxPrice]].forEach(([field, value]) => {
    if (Number.isNaN(value) || (value !== null && value < 0)) fail(field, 'Price must be a positive number');
  });
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    fail('minPrice', 'minPrice cannot be greater than maxPrice');
  }

  const sort = query.sort ? String(query.sort) : 'featured';
  if (!SORT_OPTIONS.includes(sort)) fail('sort', `Sort must be one of: ${SORT_OPTIONS.join(', ')}`);

  const page = toNumber(query.page) ?? 1;
  if (!Number.isInteger(page) || page < 1) fail('page', 'Page must be a whole number of 1 or more');

  const limit = toNumber(query.limit) ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    fail('limit', `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`);
  }

  const inStock = query.inStock === true || query.inStock === 'true';

  if (errors.length) throw apiError(400, 'Invalid query parameters', errors);
  return { search, origins, category, minPct, maxPct, minPrice, maxPrice, inStock, sort, page, limit };
}

/* ------------------------------------------------------------------ */
/* MongoDB filter, sort and facets                                     */
/* ------------------------------------------------------------------ */

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns clean filters into a MongoDB filter for the products collection.
 * `skip` leaves out one filter so facet counts show what else is available.
 * `stockIds` is the list of in-stock product ids (only needed for inStock).
 */
export function buildProductFilter(f, { skip = null, stockIds = null } = {}) {
  const filter = {};
  if (f.search) {
    const words = normalizeText(f.search).split(/\s+/).filter(Boolean);
    if (words.length) filter.$and = words.map((word) => ({ searchText: { $regex: escapeRegex(word) } }));
  }
  if (skip !== 'origin' && f.origins.length) filter.origin = { $in: f.origins };
  if (skip !== 'category' && f.category) filter.category = f.category;
  if (f.minPct !== null || f.maxPct !== null) {
    filter.cacaoPct = {};
    if (f.minPct !== null) filter.cacaoPct.$gte = f.minPct;
    if (f.maxPct !== null) filter.cacaoPct.$lte = f.maxPct;
  }
  if (f.minPrice !== null || f.maxPrice !== null) {
    filter.price = {};
    if (f.minPrice !== null) filter.price.$gte = f.minPrice;
    if (f.maxPrice !== null) filter.price.$lte = f.maxPrice;
  }
  if (f.inStock) filter._id = { $in: stockIds || [] };
  return filter;
}

// Ties are broken by English name so the order is always the same
export const MONGO_SORTS = {
  featured: { featuredRank: 1, 'name.en': 1 },
  price_asc: { price: 1, 'name.en': 1 },
  price_desc: { price: -1, 'name.en': 1 },
  pct_desc: { cacaoPct: -1, 'name.en': 1 },
  pct_asc: { cacaoPct: 1, 'name.en': 1 },
  newest: { createdAt: -1, 'name.en': 1 },
};

async function inStockIds() {
  return Inventory.distinct('product', { stock: { $gt: 0 } });
}

/** Adds stock, inStock and lowStock to each product (a join with Inventory). */
export async function withInventory(products) {
  if (!products.length) return [];
  const rows = await Inventory.find({ product: { $in: products.map((p) => p._id) } }).lean();
  const byProduct = new Map(rows.map((row) => [row.product, row]));
  return products.map((product) => {
    const row = byProduct.get(product._id) || { stock: 0, lowStockThreshold: 0 };
    return {
      ...product,
      stock: row.stock,
      inStock: row.stock > 0,
      lowStock: row.stock > 0 && row.stock <= row.lowStockThreshold,
    };
  });
}

async function countBy(field, filter) {
  const rows = await Product.aggregate([{ $match: filter }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

// Filter options for the sidebar: every origin/category with how many products match
async function buildFacets(filters, stockIds) {
  const [originCounts, categoryCounts, origins, ranges] = await Promise.all([
    countBy('origin', buildProductFilter(filters, { skip: 'origin', stockIds })),
    countBy('category', buildProductFilter(filters, { skip: 'category', stockIds })),
    Product.distinct('origin'),
    Product.aggregate([
      {
        $group: {
          _id: null,
          minPct: { $min: '$cacaoPct' },
          maxPct: { $max: '$cacaoPct' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]),
  ]);
  const range = ranges[0] || { minPct: 0, maxPct: 100, minPrice: 0, maxPrice: 0 };
  return {
    origins: origins.sort().map((value) => ({ value, count: originCounts[value] || 0 })),
    categories: CATEGORIES.map((value) => ({ value, count: categoryCounts[value] || 0 })),
    cacaoPct: { min: range.minPct, max: range.maxPct },
    price: { min: Math.floor(range.minPrice), max: Math.ceil(range.maxPrice) },
  };
}

/* ------------------------------------------------------------------ */
/* Cart rules                                                          */
/* ------------------------------------------------------------------ */

/** Rejects anything that is not a list of { productId, quantity >= 1 }. */
export function validateCartItems(items) {
  if (!Array.isArray(items)) {
    throw apiError(400, 'Validation failed', [{ field: 'items', message: 'items must be an array' }]);
  }
  if (items.length > MAX_CART_LINES) {
    throw apiError(400, 'Validation failed', [
      { field: 'items', message: `A cart can hold up to ${MAX_CART_LINES} products` },
    ]);
  }
  const errors = [];
  items.forEach((item, index) => {
    if (!item || typeof item.productId !== 'string' || !item.productId || item.productId.length > 64) {
      errors.push({ field: `items[${index}].productId`, message: 'productId is required' });
    }
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      errors.push({ field: `items[${index}].quantity`, message: 'quantity must be a whole number of 1 or more' });
    }
  });
  if (errors.length) throw apiError(400, 'Validation failed', errors);
}

/**
 * Checks each line against the catalog and stock:
 *  - combines duplicate lines
 *  - drops unknown or sold-out products
 *  - lowers quantities to what is in stock (and to MAX_QTY_PER_ITEM)
 * Returns the clean lines plus what changed, so the cart drawer can tell the user.
 */
export function reconcileItems(items, catalogById) {
  const combined = new Map();
  items.forEach(({ productId, quantity }) => combined.set(productId, (combined.get(productId) || 0) + quantity));

  const clean = [];
  const adjustments = [];
  combined.forEach((quantity, productId) => {
    const product = catalogById.get(productId);
    if (!product) {
      adjustments.push({ productId, reason: 'unavailable' });
    } else if (!product.inStock) {
      adjustments.push({ productId, reason: 'outOfStock' });
    } else {
      const allowed = Math.min(quantity, product.stock, MAX_QTY_PER_ITEM);
      if (allowed < quantity) adjustments.push({ productId, reason: 'limited', quantity: allowed });
      clean.push({ productId, quantity: allowed });
    }
  });
  return { clean, adjustments };
}

async function loadCatalog(items) {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await withInventory(await Product.find({ _id: { $in: ids } }).lean());
  return new Map(products.map((p) => [p._id, p]));
}

function cartResponse(items, updatedAt, adjustments, catalogById) {
  return {
    cart: {
      items: items.map((line) => ({ ...line, product: catalogById.get(line.productId) })),
      updatedAt: updatedAt || null,
    },
    adjustments,
  };
}

async function saveCart(userId, items) {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items } },
    { new: true, upsert: true, runValidators: true, lean: true }
  );
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

// The signed-in user's id as text (Cart.user is a string)
const userIdOf = (req) => String(req.user._id);

/**
 * requireAuth defaults to Student 1's protect (JWT check). Tests pass a stand-in.
 */
export function makeStudent3Router({ requireAuth = protect } = {}) {
  const router = Router();

  router.get('/products', async (req, res) => {
    const filters = parseProductQuery(req.query);
    const stockIds = filters.inStock ? await inStockIds() : null;
    const filter = buildProductFilter(filters, { stockIds });

    const total = await Product.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const page = Math.min(filters.page, totalPages); // a page past the end shows the last page

    const [docs, facets] = await Promise.all([
      Product.find(filter)
        .sort(MONGO_SORTS[filters.sort])
        .skip((page - 1) * filters.limit)
        .limit(filters.limit)
        .lean(),
      buildFacets(filters, stockIds),
    ]);

    res.status(200).json({
      products: await withInventory(docs),
      pagination: { page, limit: filters.limit, total, totalPages },
      facets,
    });
  });

  router.get('/products/:slug', async (req, res) => {
    const slug = String(req.params.slug).toLowerCase().slice(0, 120);
    const product = await Product.findOne({ slug }).lean();
    if (!product) throw apiError(404, 'Product not found');
    const [withStock] = await withInventory([product]);
    res.status(200).json({ product: withStock });
  });

  router.get('/cart', requireAuth, async (req, res) => {
    const saved = await Cart.findOne({ user: userIdOf(req) }).lean();
    const items = saved?.items || [];
    const catalog = await loadCatalog(items);
    // Stock may have changed since the cart was saved
    const { clean, adjustments } = reconcileItems(items, catalog);
    res.status(200).json(cartResponse(clean, saved?.updatedAt, adjustments, catalog));
  });

  router.post('/cart/persist', requireAuth, async (req, res) => {
    const items = req.body?.items;
    validateCartItems(items);
    const catalog = await loadCatalog(items);
    const { clean, adjustments } = reconcileItems(items, catalog);
    const saved = await saveCart(userIdOf(req), clean);
    res.status(200).json(cartResponse(saved.items, saved.updatedAt, adjustments, catalog));
  });

  router.post('/cart/merge', requireAuth, async (req, res) => {
    const guestItems = req.body?.items;
    validateCartItems(guestItems);
    const saved = await Cart.findOne({ user: userIdOf(req) }).lean();
    const all = [...(saved?.items || []), ...guestItems];
    const catalog = await loadCatalog(all);
    const { clean, adjustments } = reconcileItems(all, catalog);
    const merged = await saveCart(userIdOf(req), clean);
    res.status(200).json(cartResponse(merged.items, merged.updatedAt, adjustments, catalog));
  });

  // JSON errors for this router: 400/401/404 with details, 500 without internals
  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ message: err.message, errors: err.errors || [] });
    }
    console.error('[student3]', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.', errors: [] });
  });

  return router;
}
