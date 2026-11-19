/**
 * ProductDetailPage (/:lang/catalog/:slug) - one product in full (Student 3).
 * Loads GET /api/products/:slug, shows origin, tasting notes and stock,
 * and adds the chosen quantity to the cart.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Leaf, Loader2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useCart } from '../context/CartContext';
import usePageTitle from '../hooks/usePageTitle';
import { fetchProduct } from '../services/productService';
import { formatPrice, localized } from '../utils/format';
import { MAX_QTY } from '../context/cartReducer';
import ProductArt from '../components/catalog/ProductArt';
import StockStatus from '../components/catalog/StockStatus';
import QuantityStepper from '../components/cart/QuantityStepper';
import Button from '../components/ui/Button';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { lang, t, localePath } = useLanguage();
  const { addItem, quantityOf } = useCart();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notFound | error
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setQuantity(1);
    fetchProduct(slug)
      .then(({ product: found }) => {
        if (!active) return;
        setProduct(found);
        setStatus('ready');
      })
      .catch((error) => {
        if (active) setStatus(error.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const name = product ? localized(product.name, lang) : '';
  usePageTitle(status === 'notFound' ? t('shop.product.notFoundTitle') : name || t('pages.catalog.title'));

  const backLink = (
    <Link
      to={localePath('/catalog')}
      className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-cocoa-700 hover:text-cocoa-900 hover:underline"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      {t('shop.product.backToCatalog')}
    </Link>
  );

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24 text-cocoa-500" role="status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        {backLink}
        <h1 className="mt-6 text-3xl font-semibold text-cocoa-900">
          {status === 'notFound' ? t('shop.product.notFoundTitle') : t('shop.catalog.errorTitle')}
        </h1>
        {status === 'notFound' && <p className="mt-3 text-cocoa-700">{t('shop.product.notFoundText')}</p>}
      </section>
    );
  }

  const inCart = quantityOf(product._id);
  const available = Math.max(0, Math.min(product.stock, MAX_QTY) - inCart); // what can still be added
  const notes = localized(product.tastingNotes, lang);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav aria-label={t('shop.product.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-2 text-sm text-cocoa-600">
          <li>
            <Link to={localePath('/catalog')} className="rounded-sm hover:text-cocoa-900 hover:underline">
              {t('pages.catalog.title')}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              to={`${localePath('/catalog')}?category=${product.category}`}
              className="rounded-sm hover:text-cocoa-900 hover:underline"
            >
              {t(`shop.catalog.categories.${product.category}`)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-cocoa-900">
            {name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="self-start overflow-hidden rounded-2xl ring-1 ring-cocoa-200">
          <ProductArt product={product} className="aspect-[4/3] w-full" />
        </div>

        <div>
          <p className="text-sm text-cocoa-600">
            {product.origin}, {product.region}
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-cocoa-900 sm:text-4xl">{name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-cocoa-900 px-3 py-1 font-semibold text-cream">
              {t('shop.product.cacao', { pct: product.cacaoPct })}
            </span>
            {product.isOrganic && (
              <span className="inline-flex items-center gap-1 text-emerald-800">
                <Leaf size={15} aria-hidden="true" />
                {t('shop.product.organic')}
              </span>
            )}
          </div>

          <p className="mt-6 max-w-prose font-serif text-lg leading-8 text-cocoa-800">
            {localized(product.description, lang)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-cocoa-200 py-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-cocoa-600">{t('shop.product.origin')}</dt>
              <dd className="mt-0.5 font-medium text-cocoa-900">{product.origin}</dd>
            </div>
            <div>
              <dt className="text-cocoa-600">{t('shop.product.region')}</dt>
              <dd className="mt-0.5 font-medium text-cocoa-900">{product.region}</dd>
            </div>
            <div>
              <dt className="text-cocoa-600">{t('shop.product.netWeight')}</dt>
              <dd className="mt-0.5 font-medium text-cocoa-900">{t('shop.product.weight', { grams: product.weightGrams })}</dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-cocoa-600">{t('shop.product.tastingNotes')}</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {notes.map((note) => (
                  <span key={note} className="rounded-full bg-cocoa-100 px-3 py-1 text-cocoa-800">
                    {note}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-2xl font-semibold text-cocoa-900">{formatPrice(product.price, lang)}</p>
            <StockStatus product={product} showInStock className="mt-1" />
          </div>

          {product.inStock && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {available > 0 ? (
                <>
                  <QuantityStepper
                    value={Math.min(quantity, available)}
                    max={available}
                    onChange={setQuantity}
                    label={t('shop.product.quantity')}
                  />
                  <Button variant="gold" onClick={() => addItem(product, Math.min(quantity, available))}>
                    <ShoppingBag size={16} aria-hidden="true" />
                    {t('shop.product.addToCart')}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-cocoa-700">{t('shop.product.maxReached')}</p>
              )}
            </div>
          )}
          {inCart > 0 && <p className="mt-3 text-sm text-cocoa-600">{t('shop.product.inCart', { count: inCart })}</p>}

          <div className="mt-8">{backLink}</div>
        </div>
      </div>
    </section>
  );
}
