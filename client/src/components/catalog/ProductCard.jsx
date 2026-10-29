/**
 * ProductCard - one product in the catalog grid.
 * The name links to the product page; "Add to cart" puts one unit in the cart
 * and opens the cart drawer.
 */
import { Link } from 'react-router-dom';
import { Leaf, Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, localized } from '../../utils/format';
import ProductArt from './ProductArt';
import StockStatus from './StockStatus';

export default function ProductCard({ product }) {
  const { lang, t, localePath } = useLanguage();
  const { addItem, quantityOf } = useCart();

  const name = localized(product.name, lang);
  const href = localePath(`/catalog/${product.slug}`);
  const allInCart = product.inStock && quantityOf(product._id) >= product.stock;
  const canAdd = product.inStock && !allInCart;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white/70 ring-1 ring-cocoa-200 transition-shadow hover:shadow-md hover:ring-cocoa-300">
      {/* Picture link is skipped by Tab and screen readers: the name below is the same link */}
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block">
        <ProductArt product={product} className="aspect-[4/3] w-full" />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-cocoa-900 px-2 py-0.5 font-semibold text-cream">
            {t('shop.product.cacao', { pct: product.cacaoPct })}
          </span>
          {product.isOrganic && (
            <span className="inline-flex items-center gap-1 text-emerald-800">
              <Leaf size={13} aria-hidden="true" />
              {t('shop.product.organic')}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-cocoa-900">
          <Link
            to={href}
            className="rounded-sm hover:text-cocoa-600 hover:underline hover:underline-offset-4"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-cocoa-600">
          {product.origin}, {product.region}
        </p>
        <p className="mt-2 text-sm text-cocoa-700">{localized(product.tastingNotes, lang).join(', ')}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-semibold text-cocoa-900">{formatPrice(product.price, lang)}</p>
            <StockStatus product={product} />
          </div>
          <button
            type="button"
            onClick={() => addItem(product, 1)}
            disabled={!canAdd}
            aria-label={t('shop.product.addNamed', { name })}
            title={allInCart ? t('shop.product.maxReached') : undefined}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-cocoa-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-cocoa-200 disabled:text-cocoa-600"
          >
            <Plus size={16} aria-hidden="true" />
            {t('shop.product.addToCart')}
          </button>
        </div>
      </div>
    </article>
  );
}
