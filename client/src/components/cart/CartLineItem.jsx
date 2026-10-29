/**
 * CartLineItem - one product row in the cart drawer:
 * picture, name, unit price, quantity stepper, line total and a remove button.
 */
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatPrice, localized } from '../../utils/format';
import { MAX_QTY } from '../../context/cartReducer';
import ProductArt from '../catalog/ProductArt';
import QuantityStepper from './QuantityStepper';

export default function CartLineItem({ line }) {
  const { lang, t, localePath } = useLanguage();
  const { updateQuantity, removeItem, closeCart } = useCart();
  const { product, quantity } = line;
  const name = localized(product.name, lang);
  const lineTotal = (Math.round(product.price * 100) * quantity) / 100;

  return (
    <li className="flex gap-4 py-4">
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-cocoa-200">
        <ProductArt product={product} className="h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={localePath(`/catalog/${product.slug}`)}
              onClick={closeCart}
              className="rounded-sm font-semibold leading-snug text-cocoa-900 hover:underline"
            >
              {name}
            </Link>
            <p className="text-xs text-cocoa-600">
              {product.origin} | {t('shop.product.cacao', { pct: product.cacaoPct })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(line.productId)}
            aria-label={t('shop.cart.remove', { name })}
            className="shrink-0 rounded-full p-1.5 text-cocoa-600 hover:bg-cocoa-100 hover:text-red-700"
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <QuantityStepper
            size="sm"
            value={quantity}
            max={Math.min(product.stock ?? MAX_QTY, MAX_QTY)}
            onChange={(next) => updateQuantity(line.productId, next)}
            label={`${t('shop.product.quantity')}: ${name}`}
          />
          <div className="text-right">
            <p className="font-semibold text-cocoa-900">{formatPrice(lineTotal, lang)}</p>
            {quantity > 1 && (
              <p className="text-xs text-cocoa-600">{t('shop.cart.each', { price: formatPrice(product.price, lang) })}</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
