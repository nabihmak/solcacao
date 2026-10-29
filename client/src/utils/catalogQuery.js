/**
 * catalogQuery - keeps the catalog filters in the page URL (Student 3).
 *
 * Filters live in the address bar, e.g. /en/catalog?q=peru&origin=Peru,Ecuador&minPct=70&sort=price_asc
 * so a filtered view can be bookmarked or shared, the Back button undoes a filter,
 * the navbar search (?q=...) lands straight on results, and the EN/ES switch keeps them.
 *
 *   readCatalogParams(searchParams) -> { q, origins, category, minPct, ... } with defaults
 *   toSearchParams(filters)         -> URLSearchParams with default values left out
 *   toApiQuery(filters)             -> the query object for GET /api/products
 */
import { CATEGORIES, SORT_OPTIONS } from '../data/products';

export const DEFAULT_FILTERS = {
  q: '',
  origins: [],
  category: '',
  minPct: null,
  maxPct: null,
  minPrice: null,
  maxPrice: null,
  inStock: false,
  sort: 'featured',
  page: 1,
};

// A whole/decimal number from the URL, or null when missing or invalid
function readNumber(value, { min = 0, max = Infinity } = {}) {
  if (value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export function readCatalogParams(searchParams) {
  const get = (key) => searchParams.get(key);
  const category = get('category') || '';
  const sort = get('sort') || 'featured';
  const page = readNumber(get('page'), { min: 1 });

  // A hand-edited URL with min > max is swapped instead of failing
  let minPct = readNumber(get('minPct'), { max: 100 });
  let maxPct = readNumber(get('maxPct'), { max: 100 });
  if (minPct !== null && maxPct !== null && minPct > maxPct) [minPct, maxPct] = [maxPct, minPct];
  let minPrice = readNumber(get('minPrice'));
  let maxPrice = readNumber(get('maxPrice'));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

  return {
    q: (get('q') || '').slice(0, 100),
    origins: (get('origin') || '').split(',').map((o) => o.trim()).filter(Boolean),
    category: CATEGORIES.includes(category) ? category : '',
    minPct,
    maxPct,
    minPrice,
    maxPrice,
    inStock: get('inStock') === '1',
    sort: SORT_OPTIONS.includes(sort) ? sort : 'featured',
    page: page ? Math.floor(page) : 1,
  };
}

export function toSearchParams(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.origins?.length) params.set('origin', filters.origins.join(','));
  if (filters.category) params.set('category', filters.category);
  ['minPct', 'maxPct', 'minPrice', 'maxPrice'].forEach((key) => {
    if (filters[key] !== null && filters[key] !== undefined) params.set(key, String(filters[key]));
  });
  if (filters.inStock) params.set('inStock', '1');
  if (filters.sort && filters.sort !== 'featured') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function toApiQuery(filters, limit) {
  const query = { sort: filters.sort, page: filters.page };
  if (limit) query.limit = limit;
  if (filters.q) query.search = filters.q;
  if (filters.origins.length) query.origin = filters.origins.join(',');
  if (filters.category) query.category = filters.category;
  ['minPct', 'maxPct', 'minPrice', 'maxPrice'].forEach((key) => {
    if (filters[key] !== null) query[key] = filters[key];
  });
  if (filters.inStock) query.inStock = true;
  return query;
}

// How many filters are switched on (shown on the mobile "Filters" button)
export function activeFilterCount(filters) {
  return (
    filters.origins.length +
    (filters.category ? 1 : 0) +
    (filters.minPct !== null || filters.maxPct !== null ? 1 : 0) +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}
