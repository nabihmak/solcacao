/**
 * Student 2: Accessible, presentational shopping-cart indicator.
 * - count is provided by the parent and never creates sample cart items.
 * - Invalid/negative counts display as zero; badge values >99 show 99+.
 * - Full quantity is announced via a localized status label.
 * - Student 3 will supply actual shared cart state during integration.
 */
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CartIndicator({ count = 0 }) {
  const { t } = useLanguage();

  const itemCount =
    Number.isFinite(count) && count > 0
      ? Math.floor(count)
      : 0;

  const cartLabel = t('cart.itemsLabel', { count: itemCount });

  return (
    <span
      role="status"
      aria-label={cartLabel}
      className="relative inline-flex h-10 w-10
        items-center justify-center text-cream"
    >
      <ShoppingBag size={23} aria-hidden="true" />

      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1
            flex min-h-5 min-w-5 items-center
            justify-center rounded-full bg-gold-500
            px-1 text-xs font-bold text-cocoa-950"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </span>
  );
}