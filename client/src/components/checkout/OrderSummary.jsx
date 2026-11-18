/**
 * Order summary pieces shared by the checkout page and the order confirmation (Student 3).
 *   <OrderLines lines={[{ productId, name, origin, cacaoPct, category, unitPrice, quantity }]} />
 *   <OrderTotals totals={{ subtotal, shippingCost, tax, total }} />
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { formatPrice, localized } from '../../utils/format';
import ProductArt from '../catalog/ProductArt';

export function OrderLines({ lines }) {
  const { lang, t } = useLanguage();
  return (
    <ul className="divide-y divide-cocoa-200">
      {lines.map((line) => (
        <li key={line.productId} className="flex items-center gap-3 py-3">
          <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-cocoa-200">
            <ProductArt product={line} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-cocoa-900">{localized(line.name, lang)}</p>
            <p className="text-xs text-cocoa-600">
              {t('shop.checkout.qtyEach', { quantity: line.quantity, price: formatPrice(line.unitPrice, lang) })}
            </p>
          </div>
          <p className="text-sm font-semibold text-cocoa-900">
            {formatPrice((Math.round(line.unitPrice * 100) * line.quantity) / 100, lang)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ totals }) {
  const { lang, t } = useLanguage();
  const row = (label, value, strong = false) => (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold text-cocoa-900' : 'text-sm text-cocoa-700'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <dl className="space-y-2">
      {row(t('shop.cart.subtotal'), formatPrice(totals.subtotal, lang))}
      {row(
        t('shop.checkout.shipping'),
        totals.shippingCost === 0 ? t('shop.checkout.free') : formatPrice(totals.shippingCost, lang)
      )}
      {row(t('shop.checkout.tax'), formatPrice(totals.tax, lang))}
      <div className="border-t border-cocoa-200 pt-2">{row(t('shop.checkout.total'), formatPrice(totals.total, lang), true)}</div>
    </dl>
  );
}

// Cart lines ({ productId, quantity, product }) in the shape OrderLines uses
export function cartToLines(items) {
  return items.map(({ productId, quantity, product }) => ({
    productId,
    quantity,
    name: product.name,
    origin: product.origin,
    cacaoPct: product.cacaoPct,
    category: product.category,
    unitPrice: product.price,
  }));
}
