/**
 * SeasonalPicks - homepage row with the seasonal chocolates (Student 3).
 * Loads them from the catalog API: GET /api/products?category=seasonal&limit=3
 * and shows them with the same ProductCard as the catalog.
 * If the API cannot be reached, the section is simply left out of the page.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { fetchProducts } from '../../services/productService';
import ProductCard from '../catalog/ProductCard';

export default function SeasonalPicks() {
  const { t, localePath } = useLanguage();
  const [state, setState] = useState({ status: 'loading', products: [] });

  useEffect(() => {
    let active = true;
    fetchProducts({ category: 'seasonal', limit: 3 })
      .then((data) => active && setState({ status: 'ready', products: data.products || [] }))
      .catch(() => active && setState({ status: 'error', products: [] }));
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'error' || (state.status === 'ready' && state.products.length === 0)) return null;

  return (
    <section aria-labelledby="seasonal-title" className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-700">
            {t('homeSections.seasonal.eyebrow')}
          </p>
          <h2 id="seasonal-title" className="mt-2 font-serif text-3xl text-cocoa-900">
            {t('homeSections.seasonal.title')}
          </h2>
        </div>
        <Link
          to={`${localePath('/catalog')}?category=seasonal`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cocoa-800 underline-offset-4 hover:underline"
        >
          {t('homeSections.seasonal.viewAll')}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      {state.status === 'loading' ? (
        <p role="status" className="mt-8 text-cocoa-600">
          {t('homeSections.seasonal.loading')}
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state.products.map((product) => (
            <li key={product._id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
