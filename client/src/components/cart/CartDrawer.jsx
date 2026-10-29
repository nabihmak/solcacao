/**
 * CartDrawer - slide-out shopping cart (Student 3).
 * Rendered once in LangLayout; opened from the navbar cart button or by addItem().
 */
import { Link } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatPrice, localized } from '../../utils/format';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import CartLineItem from './CartLineItem';

function SyncNote() {
  const { syncStatus, closeCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return (
      <p className="text-xs text-cocoa-700">
        {t('shop.cart.signInToSave')}{' '}
        <button
          type="button"
          onClick={() => {
            closeCart();
            openAuthModal();
          }}
          className="font-semibold text-gold-700 underline-offset-2 hover:underline"
        >
          {t('shop.cart.signIn')}
        </button>
      </p>
    );
  }
  const messages = { saving: 'shop.cart.saving', saved: 'shop.cart.saved', error: 'shop.cart.saveError' };
  if (!messages[syncStatus]) return null;
  return (
    <p className={`text-xs ${syncStatus === 'error' ? 'text-red-700' : 'text-cocoa-600'}`}>{t(messages[syncStatus])}</p>
  );
}

export default function CartDrawer() {
  const { items, itemCount, subtotal, isCartOpen, closeCart, notice, dismissNotice, lastAdded } = useCart();
  const { lang, t, localePath } = useLanguage();

  const footer = items.length > 0 && (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-cocoa-900">{t('shop.cart.subtotal')}</span>
        <span className="text-xl font-semibold text-cocoa-900">{formatPrice(subtotal, lang)}</span>
      </div>
      <p className="text-xs text-cocoa-600">{t('shop.cart.shippingNote')}</p>
      {/* Checkout is not part of Phase 2; the button shows where it will go */}
      <Button variant="gold" className="w-full" disabled aria-describedby="checkout-note">
        {t('shop.cart.checkout')}
      </Button>
      <p id="checkout-note" className="text-center text-xs text-cocoa-600">
        {t('shop.cart.checkoutSoon')}
      </p>
      <SyncNote />
    </div>
  );

  return (
    <>
      <Drawer
        open={isCartOpen}
        onClose={closeCart}
        title={`${t('shop.cart.title')}${itemCount ? ` (${itemCount})` : ''}`}
        closeLabel={t('shop.cart.close')}
        footer={footer}
      >
        {notice && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-gold-300/40 px-3 py-2.5 text-sm text-cocoa-900">
            <span className="flex-1">{t(notice)}</span>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label={t('shop.cart.dismiss')}
              className="rounded-full p-0.5 hover:bg-gold-300"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <ShoppingBag size={40} aria-hidden="true" className="text-cocoa-300" />
            <p className="mt-4 text-lg font-semibold text-cocoa-900">{t('shop.cart.empty')}</p>
            <p className="mt-1 max-w-xs text-sm text-cocoa-700">{t('shop.cart.emptyText')}</p>
            <Link
              to={localePath('/catalog')}
              onClick={closeCart}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-cocoa-900 px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cocoa-700"
            >
              {t('shop.cart.browse')}
            </Link>
            <div className="mt-6">
              <SyncNote />
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-cocoa-200">
            {items.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </ul>
        )}
      </Drawer>

      {/* Tells screen-reader users that an item went into the cart */}
      <p role="status" className="sr-only">
        {lastAdded ? t('shop.cart.added', { name: localized(lastAdded.name, lang) }) : ''}
      </p>
    </>
  );
}
