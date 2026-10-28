import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CartIndicator({ count = 0 }) {
  const { lang } = useLanguage();

  const itemCount =
    Number.isFinite(count) && count > 0
      ? Math.floor(count)
      : 0;

  const cartLabel =
    lang === 'es'
      ? `Carrito: ${itemCount} productos`
      : `Cart: ${itemCount} items`;

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