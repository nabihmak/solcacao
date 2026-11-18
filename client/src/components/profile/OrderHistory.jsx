/**
 * OrderHistory - "Orders" tab of the account page (Student 3).
 * Lists the signed-in user's orders (GET /api/orders), newest first; each one links
 * to its detail page /:lang/orders/:reference.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Package } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getOrders } from '../../services/orderService';
import { readApiError } from '../../utils/apiErrors';
import { formatPrice } from '../../utils/format';
import { formatOrderDate } from '../../pages/OrderConfirmationPage';
import Alert from '../ui/Alert';

export default function OrderHistory() {
  const { lang, t, localePath } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOrders()
      .then((data) => active && setOrders(data.orders))
      .catch((err) => {
        if (!active) return;
        setError(readApiError(err, t).message);
        setOrders([]);
      });
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold">{t('account.orders.title')}</h2>
      <p className="mt-1 text-sm text-cocoa-600">{t('account.orders.text')}</p>

      <div className="mt-5">
        <Alert type="error">{error}</Alert>
        {orders === null && (
          <p role="status" className="flex items-center gap-2 text-sm text-cocoa-600">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t('common.loading')}
          </p>
        )}

        {orders?.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-cocoa-300 p-6 text-center">
            <Package size={28} aria-hidden="true" className="mx-auto text-cocoa-400" />
            <p className="mt-2 font-semibold text-cocoa-900">{t('account.orders.empty')}</p>
            <Link
              to={localePath('/catalog')}
              className="mt-3 inline-block text-sm font-semibold text-gold-700 underline-offset-2 hover:underline"
            >
              {t('shop.cart.browse')}
            </Link>
          </div>
        )}

        {orders?.length > 0 && (
          <ul className="divide-y divide-cocoa-200 rounded-xl border border-cocoa-200">
            {orders.map((order) => (
              <li key={order.reference}>
                <Link
                  to={localePath(`/orders/${order.reference}`)}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-cocoa-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold tracking-wide text-cocoa-900">{order.reference}</p>
                    <p className="text-sm text-cocoa-600">
                      {formatOrderDate(order.createdAt, lang)} · {t('account.orders.itemCount', { count: order.itemCount })}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-gold-300/50 px-3 py-1 text-xs font-semibold text-cocoa-900 sm:inline">
                    {t(`shop.order.statuses.${order.status}`)}
                  </span>
                  <span className="font-semibold text-cocoa-900">{formatPrice(order.total, lang)}</span>
                  <ChevronRight size={18} aria-hidden="true" className="text-cocoa-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
