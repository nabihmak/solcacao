/**
 * catalogMockApi.js - PHASE 2 ONLY: stand-in for the catalog and cart endpoints (Student 3).
 *
 * Works like services/mockApi.js (Student 1): every function answers like the planned
 * REST endpoint, with the same data shape and the same error codes, so in Phase 3 only
 * productService.js and cartService.js change to fetch() calls.
 *
 *   getProducts(query)          -> GET  /api/products?search=&origin=&minPct=...  (200)
 *   getProductBySlug(slug)      -> GET  /api/products/:slug                       (200 / 404)
 *   getCart(token)              -> GET  /api/cart                                 (200 / 401)
 *   persistCart(token, items)   -> POST /api/cart/persist                         (200 / 400 / 401)
 *   mergeCart(token, guestItems)-> POST /api/cart/merge                           (200 / 400 / 401)
 *
 * Signed-in users are looked up with Student 1's getMe(token), so a bad or expired token
 * gives the same 401 as every other protected call.
 */
import { CATEGORIES, INVENTORY, PRODUCTS, SORT_OPTIONS } from '../data/products';
import { getMe } from './mockApi';

const CARTS_KEY = 'solcacao_mock_carts';
const DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 250;

export const MAX_QTY_PER_ITEM = 99;
export const MAX_CART_LINES = 50;
export const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 48;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

/* ------------------------------------------------------------------ */
/* Products + inventory join                                           */
/* ------------------------------------------------------------------ */

const stockById = new Map(INVENTORY.map((row) => [row.productId, row]));

// Adds stock information to a product, like a $lookup on the Inventory collection
function withInventory(product) {
  const row = stockById.get(product._id) || { stock: 0, lowStockThreshold: 0 };
  return {
    ...product,
    stock: row.stock,
    inStock: row.stock > 0,
    lowStock: row.stock > 0 && row.stock <= row.lowStockThreshold,
  };
}

const CATALOG = PRODUCTS.map(withInventory);
const byId = new Map(CATALOG.map((p) => [p._id, p]));

// Lowercase and strip accents, so "cafe" finds "Café" and "lucuma" finds "Lúcuma"
export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function searchableText(product) {
  return normalizeText(
    [
      product.name.en,
      product.name.es,
      product.origin,
      product.region,
      product.category,
      product.sku,
      ...product.tastingNotes.en,
      ...product.tastingNotes.es,
    ].join(' ')
  );
}
const SEARCH_INDEX = new Map(CATALOG.map((p) => [p._id, searchableText(p)]));

/* ------------------------------------------------------------------ */
/* Query parsing + validation (planned: express-validator / Joi)       */
/* ------------------------------------------------------------------ */

function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

// Returns a number, null when empty, or NaN when it is not a number
function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

/**
 * Reads the query object and returns clean filters, or throws 400 with field errors.
 * Accepts the same names the URL uses: search, origin, category, minPct, maxPct,
 * minPrice, maxPrice, inStock, sort, page, limit.
 */
export function parseProductQuery(query = {}) {
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  const search = String(query.search ?? '').trim();
  if (search.length > 100) fail('search', 'Search text must be 100 characters or fewer');

  const origins = toList(query.origin);
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
/* Filtering, facets, sorting, pagination                              */
/* ------------------------------------------------------------------ */

// Each filter is a small test; "skip" lets the facet counts ignore their own filter
function matches(product, f, skip = null) {
  if (f.search) {
    const words = normalizeText(f.search).split(/\s+/);
    const text = SEARCH_INDEX.get(product._id);
    if (!words.every((word) => text.includes(word))) return false;
  }
  if (skip !== 'origin' && f.origins.length && !f.origins.includes(product.origin)) return false;
  if (skip !== 'category' && f.category && product.category !== f.category) return false;
  if (f.minPct !== null && product.cacaoPct < f.minPct) return false;
  if (f.maxPct !== null && product.cacaoPct > f.maxPct) return false;
  if (f.minPrice !== null && product.price < f.minPrice) return false;
  if (f.maxPrice !== null && product.price > f.maxPrice) return false;
  if (f.inStock && !product.inStock) return false;
  return true;
}

const SORTERS = {
  featured: (a, b) => a.featuredRank - b.featuredRank,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  pct_desc: (a, b) => b.cacaoPct - a.cacaoPct,
  pct_asc: (a, b) => a.cacaoPct - b.cacaoPct,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

function countBy(list, key) {
  return list.reduce((counts, item) => ({ ...counts, [item[key]]: (counts[item[key]] || 0) + 1 }), {});
}

// Filter options for the sidebar: every origin/category with how many products match
function buildFacets(filters) {
  const originCounts = countBy(CATALOG.filter((p) => matches(p, filters, 'origin')), 'origin');
  const categoryCounts = countBy(CATALOG.filter((p) => matches(p, filters, 'category')), 'category');
  const prices = CATALOG.map((p) => p.price);
  const pcts = CATALOG.map((p) => p.cacaoPct);

  return {
    origins: [...new Set(CATALOG.map((p) => p.origin))]
      .sort()
      .map((value) => ({ value, count: originCounts[value] || 0 })),
    categories: CATEGORIES.map((value) => ({ value, count: categoryCounts[value] || 0 })),
    cacaoPct: { min: Math.min(...pcts), max: Math.max(...pcts) },
    price: { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) },
  };
}

/** GET /api/products */
export async function getProducts(query = {}) {
  await wait(DELAY_MS);
  const filters = parseProductQuery(query);

  const found = CATALOG.filter((p) => matches(p, filters)).sort(
    (a, b) => SORTERS[filters.sort](a, b) || a.name.en.localeCompare(b.name.en)
  );

  const total = found.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const page = Math.min(filters.page, totalPages); // a page past the end shows the last page
  const start = (page - 1) * filters.limit;

  return {
    products: found.slice(start, start + filters.limit),
    pagination: { page, limit: filters.limit, total, totalPages },
    facets: buildFacets(filters),
  };
}

/** GET /api/products/:slug */
export async function getProductBySlug(slug) {
  await wait(DELAY_MS);
  const product = CATALOG.find((p) => p.slug === slug);
  if (!product) throw apiError(404, 'Product not found');
  return { product };
}

/* ------------------------------------------------------------------ */
/* Saved carts (planned Cart collection: one document per user)        */
/* ------------------------------------------------------------------ */

let memoryCarts = {};

function readCarts() {
  try {
    const raw = localStorage.getItem(CARTS_KEY);
    return raw ? JSON.parse(raw) : memoryCarts;
  } catch {
    return memoryCarts;
  }
}

function writeCarts(carts) {
  memoryCarts = carts;
  try {
    localStorage.setItem(CARTS_KEY, JSON.stringify(carts));
  } catch {
    /* keep the in-memory copy */
  }
}

// Rejects anything that is not a list of { productId, quantity >= 1 }
function assertItemShape(items) {
  if (!Array.isArray(items)) throw apiError(400, 'Validation failed', [{ field: 'items', message: 'items must be an array' }]);
  if (items.length > MAX_CART_LINES) {
    throw apiError(400, 'Validation failed', [{ field: 'items', message: `A cart can hold up to ${MAX_CART_LINES} products` }]);
  }
  const errors = [];
  items.forEach((item, index) => {
    if (!item || typeof item.productId !== 'string' || !item.productId) {
      errors.push({ field: `items[${index}].productId`, message: 'productId is required' });
    }
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      errors.push({ field: `items[${index}].quantity`, message: 'quantity must be a whole number of 1 or more' });
    }
  });
  if (errors.length) throw apiError(400, 'Validation failed', errors);
}

/**
 * Checks each line against the catalog and stock, like the server will:
 *  - combines duplicate lines
 *  - drops unknown or sold-out products
 *  - lowers quantities to what is in stock (and to MAX_QTY_PER_ITEM)
 * Returns the clean lines plus a list of what changed, so the UI can tell the user.
 */
export function reconcileItems(items) {
  const combined = new Map();
  items.forEach(({ productId, quantity }) => combined.set(productId, (combined.get(productId) || 0) + quantity));

  const clean = [];
  const adjustments = [];
  combined.forEach((quantity, productId) => {
    const product = byId.get(productId);
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

// Cart lines leave the "server" with their product details attached
function cartResponse(cart, adjustments = []) {
  return {
    cart: {
      items: cart.items.map((line) => ({ ...line, product: byId.get(line.productId) })),
      updatedAt: cart.updatedAt,
    },
    adjustments,
  };
}

function saveCart(userId, items) {
  const carts = readCarts();
  carts[userId] = { items, updatedAt: new Date().toISOString() };
  writeCarts(carts);
  return carts[userId];
}

/** GET /api/cart - the signed-in user's saved cart (empty if none yet) */
export async function getCart(token) {
  const { user } = await getMe(token);
  const saved = readCarts()[user._id] || { items: [], updatedAt: null };
  // Stock may have changed since the cart was saved
  const { clean, adjustments } = reconcileItems(saved.items);
  return cartResponse({ ...saved, items: clean }, adjustments);
}

/** POST /api/cart/persist - replaces the saved cart with the full cart from the browser */
export async function persistCart(token, items) {
  const { user } = await getMe(token);
  assertItemShape(items);
  const { clean, adjustments } = reconcileItems(items);
  return cartResponse(saveCart(user._id, clean), adjustments);
}

/**
 * POST /api/cart/merge - called right after sign-in.
 * Adds the guest cart to the cart saved on the account (quantities are summed).
 */
export async function mergeCart(token, guestItems) {
  const { user } = await getMe(token);
  assertItemShape(guestItems);
  const saved = readCarts()[user._id]?.items || [];
  const { clean, adjustments } = reconcileItems([...saved, ...guestItems]);
  return cartResponse(saveCart(user._id, clean), adjustments);
}

// Used by the unit tests to start with no saved carts
export function resetMockCarts() {
  memoryCarts = {};
  try {
    localStorage.removeItem(CARTS_KEY);
  } catch {
    /* ignore */
  }
}
