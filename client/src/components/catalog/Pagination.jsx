/**
 * Pagination - Previous / page numbers / Next for the catalog grid.
 * The current page is marked with aria-current="page".
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const BASE =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export default function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label={t('shop.catalog.pagination')} className="mt-10 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label={t('shop.catalog.previous')}
        className={`${BASE} text-cocoa-800 hover:bg-cocoa-100`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <ul className="flex items-center gap-1">
        {pages.map((number) => (
          <li key={number}>
            <button
              type="button"
              onClick={() => onPageChange(number)}
              aria-current={number === page ? 'page' : undefined}
              aria-label={t('shop.catalog.goToPage', { page: number })}
              className={`${BASE} ${number === page ? 'bg-cocoa-900 text-cream' : 'text-cocoa-800 hover:bg-cocoa-100'}`}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label={t('shop.catalog.next')}
        className={`${BASE} text-cocoa-800 hover:bg-cocoa-100`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
