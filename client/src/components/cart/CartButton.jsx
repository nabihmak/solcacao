/**
 * CartButton - the navbar cart icon (Student 3).
 * Wraps Student 2's CartIndicator (icon + count badge) in a button that opens the cart drawer.
 */
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../i18n/LanguageContext';
import CartIndicator from './CartIndicator';

export default function CartButton({ onOpen }) {
  const { itemCount, openCart, isCartOpen } = useCart();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.(); // e.g. close the mobile menu first
        openCart();
      }}
      aria-label={itemCount === 1 ? t('shop.cart.openOne') : t('shop.cart.open', { count: itemCount })}
      aria-haspopup="dialog"
      aria-expanded={isCartOpen}
      className="rounded-md hover:text-gold-400"
    >
      <CartIndicator count={itemCount} />
    </button>
  );
}
