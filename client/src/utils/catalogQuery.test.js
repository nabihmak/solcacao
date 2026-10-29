/**
 * Unit tests for the catalog URL helpers (run with: npm test)
 */
import { describe, expect, test } from 'vitest';
import { activeFilterCount, DEFAULT_FILTERS, readCatalogParams, toApiQuery, toSearchParams } from './catalogQuery';

const read = (query) => readCatalogParams(new URLSearchParams(query));

describe('readCatalogParams', () => {
  test('an empty URL gives the defaults', () => {
    expect(read('')).toEqual(DEFAULT_FILTERS);
  });

  test('reads every filter', () => {
    expect(read('q=peru&origin=Peru,Ecuador&category=bar&minPct=70&maxPrice=12&inStock=1&sort=price_asc&page=2')).toEqual({
      ...DEFAULT_FILTERS,
      q: 'peru',
      origins: ['Peru', 'Ecuador'],
      category: 'bar',
      minPct: 70,
      maxPrice: 12,
      inStock: true,
      sort: 'price_asc',
      page: 2,
    });
  });

  test('ignores invalid values and swaps a reversed range', () => {
    const filters = read('category=cake&sort=random&page=-3&minPct=abc&minPrice=20&maxPrice=5');
    expect(filters).toMatchObject({ category: '', sort: 'featured', page: 1, minPct: null, minPrice: 5, maxPrice: 20 });
  });
});

describe('toSearchParams', () => {
  test('leaves defaults out so URLs stay short', () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  test('round-trips through the URL', () => {
    const filters = { ...DEFAULT_FILTERS, q: 'cacao', origins: ['Mexico'], minPct: 60, page: 3 };
    expect(readCatalogParams(toSearchParams(filters))).toEqual(filters);
  });
});

describe('toApiQuery and activeFilterCount', () => {
  test('builds the GET /api/products query', () => {
    const filters = { ...DEFAULT_FILTERS, q: 'cacao', origins: ['Peru', 'Ghana'], maxPct: 80, inStock: true };
    expect(toApiQuery(filters, 9)).toEqual({
      sort: 'featured',
      page: 1,
      limit: 9,
      search: 'cacao',
      origin: 'Peru,Ghana',
      maxPct: 80,
      inStock: true,
    });
  });

  test('counts each active filter group', () => {
    expect(activeFilterCount({ ...DEFAULT_FILTERS, origins: ['Peru', 'Ghana'], minPct: 70, inStock: true })).toBe(4);
  });
});
