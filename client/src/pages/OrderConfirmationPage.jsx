/**
 * OrderConfirmationPage (/:lang/orders/:reference) - Student 3.
 * Shown right after checkout (the order arrives in the navigation state) and from
 * "My orders" in the account page (the order is loaded with GET /api/orders/:reference).
 * Wrapped in <ProtectedRoute>; the server only returns the signed-in user's own orders.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, PackageSearch } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
import { getOrder } from '../services/orderService';
import { cityLine } from '../utils/checkout';
import { OrderLines, OrderTotals } from '../components/checkout/OrderSummary';

const linkClass = {
  primary:
    'inline-flex items-center justify-center rounded-full bg-cocoa-900 px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cocoa-700',
  outline:
    'inline-flex items-center justify-center rounded-full border border-cocoa-300 px-5 py-2.5 text-sm font-semibold text-cocoa-800 hover:bg-cocoa-100',
};

export function formatOrderDate(iso, lang) {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'long' }).format(new Date(iso));
}

export default function OrderConfirmationPage() {
  const { reference } = useParams();
  const location = useLocation();
  const { lang, t, localePath } = useLanguage();
  const fromCheckout = location.state?.order?.reference === reference ? location.state : null;

  const [order, setOrder] = useState(fromCheckout?.order || null);
  const [failed, setFailed] = useState(false);
  const headingRef = useRef(null);
  usePageTitle(fromCheckout?.justPlaced ? t('shop.order.thanksTitle') : t('shop.order.title', { reference }));

  useEffect(() => {
    if (order) return undefined;
    let active = true;
    getOrder(reference)
      .then((data) => active && setOrder(data.order))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [reference, order]);

  // Move focus to the heading so screen readers announce the result of checkout
  useEffect(() => {
    if (order) headingRef.current?.focus();
  }, [order]);

  if (failed) {
    return (
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <PackageSearch size={36} aria-hidden="true" className="mx-auto text-cocoa-400" />
        <h1 className="mt-4 text-2xl font-semibold">{t('shop.order.notFound')}</h1>
        <Link to={localePath('/account?tab=orders')} className={`${linkClass.primary} mt-6`}>
          {t('shop.order.viewOrders')}
        </Link>
      </section>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center py-24 text-cocoa-500" role="status">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const address = order.shippingAddress;
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="on-dark rounded-2xl bg-cocoa-900 p-6 text-cream sm:p-8">
        {fromCheckout?.justPlaced && <CheckCircle2 size={36} aria-hidden="true" className="text-gold-400" />}
        <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-serif text-3xl font-semibold focus:outline-none">
          {fromCheckout?.justPlaced ? t('shop.order.thanksTitle') : t('shop.order.title', { reference: order.reference })}
        </h1>
        <p className="mt-2 text-cocoa-100">
          {fromCheckout?.justPlaced
            ? t('shop.order.thanksText', { reference: order.reference })
            : t('shop.order.placedOn', { date: formatOrderDate(order.createdAt, lang) })}
        </p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gold-300">{t('shop.order.reference')}</dt>
            <dd className="font-semibold tracking-wide">{order.reference}</dd>
          </div>
          <div>
            <dt className="text-gold-300">{t('shop.order.status')}</dt>
            <dd className="font-semibold">{t(`shop.order.statuses.${order.status}`)}</dd>
          </div>
          <div>
            <dt className="text-gold-300">{t('shop.order.delivery')}</dt>
            <dd className="font-semibold">{t(`shop.checkout.methods.${order.shippingMethod}.time`)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-cocoa-900">{t('shop.order.items', { count: order.itemCount })}</h2>
          <OrderLines lines={order.items} />
          <div className="mt-3 border-t border-cocoa-200 pt-4">
            <OrderTotals totals={order} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-cocoa-900">{t('shop.order.shipTo')}</h2>
            <address className="mt-2 text-sm not-italic leading-relaxed text-cocoa-700">
              {address.fullName}
              <br />
              {address.street}
              <br />
              {cityLine(address)}
              <br />
              {address.country}
              {address.phone && (
                <>
                  <br />
                  {address.phone}
                </>
              )}
            </address>
          </div>
          <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-cocoa-900">{t('shop.checkout.paymentTitle')}</h2>
            <p className="mt-2 text-sm text-cocoa-700">{t('shop.checkout.payOnDelivery')}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={localePath('/catalog')} className={linkClass.primary}>
          {t('shop.order.continue')}
        </Link>
        <Link to={localePath('/account?tab=orders')} className={linkClass.outline}>
          {t('shop.order.viewOrders')}
        </Link>
      </div>
    </section>
  );
}
