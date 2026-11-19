/**
 * CatalogPage (/:lang/catalog) - product showcase with search, filters, sorting and pages (Student 3).
 *
 * The filters are stored in the URL (see utils/catalogQuery.js), so:
 *  - the navbar search (/en/catalog?q=peru) opens straight on the results
 *  - a filtered view can be bookmarked or shared, and Back undoes the last change
 *  - switching EN/ES keeps the same filters
 * Every URL change loads products from GET /api/products (Phase 2: catalogMockApi.js).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
import { fetchProducts } from '../services/productService';
import { activeFilterCount, readCatalogParams, toApiQuery, toSearchParams } from '../utils/catalogQuery';
import { formatPrice } from '../utils/format';
import { SORT_OPTIONS } from '../data/products';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductCard from '../components/catalog/ProductCard';
import Pagination from '../components/catalog/Pagination';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';

const PAGE_SIZE = 9;
const SEARCH_DELAY_MS = 350;

const FIELD =
  'rounded-full border border-cocoa-300 bg-white text-cocoa-900 focus:border-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-900/25';

function SkeletonGrid() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl bg-white/70 ring-1 ring-cocoa-200">
          <div className="aspect-[4/3] animate-pulse bg-cocoa-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-cocoa-100" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-cocoa-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-cocoa-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function CatalogPage() {
  const { lang, t } = useLanguage();
  usePageTitle(t('pages.catalog.title'));

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readCatalogParams(searchParams), [searchParams]);
  const queryKey = toSearchParams(filters).toString(); // changes only when a filter really changes

  const [data, setData] = useState(null); // { products, pagination, facets }
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [reloadCount, setReloadCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState(filters.q);
  const resultsRef = useRef(null);

  // Load products whenever the filters in the URL change
  useEffect(() => {
    let active = true; // ignore an answer that arrives after a newer request
    setStatus('loading');
    fetchProducts(toApiQuery(readCatalogParams(new URLSearchParams(queryKey)), PAGE_SIZE))
      .then((response) => {
        if (!active) return;
        setData(response);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [queryKey, reloadCount]);

  // Writes new filters to the URL. Any filter change goes back to page 1.
  const updateFilters = useCallback(
    (changes, { replace = false } = {}) => {
      setSearchParams((current) => toSearchParams({ ...readCatalogParams(current), page: 1, ...changes }), {
        replace,
      });
    },
    [setSearchParams]
  );

  // Keep the search box in step with the URL (e.g. a new search from the navbar)
  useEffect(() => {
    setSearchText(filters.q);
  }, [filters.q]);

  // Search as you type, after a short pause (replace: typing does not fill the Back history)
  useEffect(() => {
    const text = searchText.trim();
    if (text === filters.q) return undefined;
    const timer = setTimeout(() => updateFilters({ q: text }, { replace: true }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, updateFilters]);

  function goToPage(page) {
    updateFilters({ page });
    resultsRef.current?.scrollIntoView({ block: 'start' });
  }

  const clearAll = useCallback(() => {
    setSearchText('');
    updateFilters({
      q: '',
      origins: [],
      category: '',
      minPct: null,
      maxPct: null,
      minPrice: null,
      maxPrice: null,
      inStock: false,
    });
  }, [updateFilters]);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const filterCount = activeFilterCount(filters);
  const hasActiveFilters = filterCount > 0 || Boolean(filters.q);
  const total = data?.pagination.total ?? 0;

  // One removable chip per active filter
  const chips = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, clear: { q: '' } });
  if (filters.category) {
    chips.push({ key: 'category', label: t(`shop.catalog.categories.${filters.category}`), clear: { category: '' } });
  }
  filters.origins.forEach((origin) =>
    chips.push({ key: `origin-${origin}`, label: origin, clear: { origins: filters.origins.filter((o) => o !== origin) } })
  );
  if (data && (filters.minPct !== null || filters.maxPct !== null)) {
    const { min, max } = data.facets.cacaoPct;
    chips.push({
      key: 'pct',
      label: t('shop.product.cacao', { pct: `${filters.minPct ?? min}–${filters.maxPct ?? max}` }),
      clear: { minPct: null, maxPct: null },
    });
  }
  if (data && (filters.minPrice !== null || filters.maxPrice !== null)) {
    const { min, max } = data.facets.price;
    chips.push({
      key: 'price',
      label: `${formatPrice(filters.minPrice ?? min, lang)} – ${formatPrice(filters.maxPrice ?? max, lang)}`,
      clear: { minPrice: null, maxPrice: null },
    });
  }
  if (filters.inStock) chips.push({ key: 'stock', label: t('shop.catalog.inStock'), clear: { inStock: false } });

  let resultsText = t('common.loading');
  if (data) {
    resultsText = total === 1 ? t('shop.catalog.resultsOne') : t('shop.catalog.results', { count: total });
    if (filters.q) resultsText += ` ${t('shop.catalog.resultsFor', { q: filters.q })}`;
  }

  const sidebar = data && (
    <FilterSidebar
      filters={filters}
      facets={data.facets}
      onChange={updateFilters}
      onClearAll={clearAll}
      hasActiveFilters={hasActiveFilters}
    />
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-cocoa-900 sm:text-4xl">{t('pages.catalog.title')}</h1>
        <p className="mt-3 leading-7 text-cocoa-700">{t('shop.catalog.intro')}</p>
      </header>

      {/* Toolbar: search, sort, and the Filters button on small screens */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form
          role="search"
          aria-label={t('shop.catalog.searchLabel')}
          className="flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({ q: searchText.trim() });
          }}
        >
          <label htmlFor="catalog-search" className="text-sm font-semibold text-cocoa-900">
            {t('shop.catalog.searchLabel')}
          </label>
          <div className="relative mt-1">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-500"
            />
            <input
              id="catalog-search"
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={t('shop.catalog.searchPlaceholder')}
              maxLength={100}
              className={`${FIELD} w-full py-2.5 pl-10 pr-4 placeholder:text-cocoa-500`}
            />
          </div>
        </form>

        <div className="flex items-end gap-3">
          <div className="flex-1 sm:flex-none">
            <label htmlFor="catalog-sort" className="text-sm font-semibold text-cocoa-900">
              {t('shop.catalog.sortLabel')}
            </label>
            <select
              id="catalog-sort"
              value={filters.sort}
              onChange={(event) => updateFilters({ sort: event.target.value })}
              className={`${FIELD} mt-1 block w-full py-2.5 pl-4 pr-9 text-sm`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`shop.catalog.sort.${option}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-full border border-cocoa-300 bg-white px-4 py-2.5 text-sm font-semibold text-cocoa-900 hover:bg-cocoa-100 lg:hidden"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            {t('shop.catalog.filters')}
            {filterCount > 0 && <span className="rounded-full bg-cocoa-900 px-2 text-xs text-cream">{filterCount}</span>}
          </button>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        {/* Filters on large screens */}
        <aside className="hidden lg:block" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">
            {t('shop.catalog.filters')}
          </h2>
          {sidebar}
        </aside>

        {/* Results */}
        <div ref={resultsRef} className="min-w-0 scroll-mt-24">
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            {/* Announced to screen readers whenever the result count changes */}
            <p role="status" className="mr-2 text-sm text-cocoa-700">
              {resultsText}
            </p>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t('shop.catalog.activeFilters')}>
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={() => {
                        if (chip.key === 'q') setSearchText('');
                        updateFilters(chip.clear);
                      }}
                      aria-label={t('shop.catalog.removeFilter', { label: chip.label })}
                      className="inline-flex items-center gap-1 rounded-full bg-cocoa-100 py-1 pl-3 pr-2 text-xs font-medium text-cocoa-800 hover:bg-cocoa-200"
                    >
                      {chip.label}
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5">
            {status === 'error' && (
              <div role="alert" className="rounded-xl bg-white/70 p-8 text-center ring-1 ring-cocoa-200">
                <p className="font-semibold text-cocoa-900">{t('shop.catalog.errorTitle')}</p>
                <Button variant="outline" className="mt-4" onClick={() => setReloadCount((n) => n + 1)}>
                  {t('shop.catalog.retry')}
                </Button>
              </div>
            )}

            {status === 'loading' && !data && <SkeletonGrid />}

            {data && status !== 'error' && data.products.length === 0 && (
              <div className="rounded-xl bg-white/70 p-8 text-center ring-1 ring-cocoa-200">
                <h2 className="text-xl font-semibold text-cocoa-900">{t('shop.catalog.emptyTitle')}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cocoa-700">{t('shop.catalog.emptyText')}</p>
                {hasActiveFilters && (
                  <Button className="mt-5" onClick={clearAll}>
                    {t('shop.catalog.clearAll')}
                  </Button>
                )}
              </div>
            )}

            {data && status !== 'error' && data.products.length > 0 && (
              <>
                <ul
                  aria-busy={status === 'loading'}
                  className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${
                    status === 'loading' ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  {data.products.map((product) => (
                    <li key={product._id}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
                <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={goToPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters on small screens: slide-in panel */}
      <Drawer
        open={filtersOpen}
        onClose={closeFilters}
        side="left"
        title={t('shop.catalog.filters')}
        closeLabel={t('shop.catalog.closeFilters')}
        footer={
          <Button className="w-full" onClick={closeFilters}>
            {t('shop.catalog.showResults')} ({total})
          </Button>
        }
      >
        {sidebar}
      </Drawer>
    </section>
  );
}
