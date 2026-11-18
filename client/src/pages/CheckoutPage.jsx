/**
 * CheckoutPage (/:lang/checkout) - Student 3.
 * Wrapped in <ProtectedRoute> in App.jsx, so the shopper is signed in (a guest cart is
 * merged into the account cart at sign-in, see CartContext).
 *
 * Steps on one page: 1 contact, 2 shipping address (a saved address or a new one),
 * 3 delivery speed, 4 payment (pay on delivery), then "Place order".
 * The server re-checks prices and stock (POST /api/orders). When it answers 409:
 *  - items changed  -> the cart is updated to what is available and the shopper reviews it
 *  - prices changed -> the new total is shown and the next click confirms it
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Lock, ShoppingBag, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageContext';
import usePageTitle from '../hooks/usePageTitle';
import { getAddresses, addAddress } from '../services/userService';
import { placeOrder } from '../services/orderService';
import { readApiError } from '../utils/apiErrors';
import { focusFirstInvalid } from '../utils/focus';
import { formatPrice } from '../utils/format';
import {
  SHIPPING_METHODS,
  SHIPPING_RATES,
  amountToFreeShipping,
  buildShipping,
  calculateTotals,
  cityLine,
  validateCheckoutForm,
} from '../utils/checkout';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { OrderLines, OrderTotals, cartToLines } from '../components/checkout/OrderSummary';

const NEW_ADDRESS = 'new';

function Step({ number, title, children }) {
  return (
    <fieldset className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden="true" className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold text-cocoa-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cocoa-900 font-sans text-sm text-cream">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

function ChoiceCard({ name, value, checked, onChange, children }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-cocoa-900/60 ${
        checked ? 'border-cocoa-900 bg-cocoa-50' : 'border-cocoa-200 hover:border-cocoa-400'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 border-cocoa-400 accent-cocoa-900 focus:ring-0"
      />
      <span className="min-w-0 flex-1 text-sm text-cocoa-800">{children}</span>
    </label>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clearCart, updateQuantity, removeItem, openCart } = useCart();
  const { lang, t, localePath } = useLanguage();
  const navigate = useNavigate();
  usePageTitle(t('shop.checkout.title'));

  const [addresses, setAddresses] = useState(null); // null while loading
  const [addressChoice, setAddressChoice] = useState(NEW_ADDRESS);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(null); // the server's total after a price change
  const [placing, setPlacing] = useState(false);
  const formRef = useRef(null);

  // Saved addresses (Student 1's address book); the default one is picked first
  useEffect(() => {
    let active = true;
    getAddresses()
      .then(({ addresses: list }) => {
        if (!active) return;
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) setAddressChoice(preferred._id);
      })
      .catch(() => active && setAddresses([]));
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => calculateTotals(subtotal, shippingMethod), [subtotal, shippingMethod]);
  const lines = useMemo(() => cartToLines(items), [items]);
  const toFree = amountToFreeShipping(subtotal);

  // A confirmed new total only applies to the cart it was given for
  useEffect(() => setConfirmedTotal(null), [items, shippingMethod]);

  const isNewAddress = addressChoice === NEW_ADDRESS;
  const savedAddress = addresses?.find((a) => a._id === addressChoice) || null;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // 409 "items changed": make the cart match what can be bought
  function applyCartChanges(problems) {
    problems.forEach(({ productId, reason, quantity }) => {
      if (reason === 'limited' && quantity > 0) updateQuantity(productId, quantity);
      else removeItem(productId);
    });
    setNotice(t('shop.checkout.cartChanged'));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');
    setNotice('');

    const found = validateCheckoutForm(form, { newAddress: isNewAddress });
    setErrors(Object.fromEntries(Object.entries(found).map(([field, key]) => [field, t(key)])));
    if (Object.keys(found).length) {
      focusFirstInvalid(formRef.current);
      return;
    }

    const shipping = buildShipping(form, isNewAddress ? null : savedAddress);
    setPlacing(true);
    try {
      const { order } = await placeOrder({
        items,
        shipping,
        shippingMethod,
        expectedTotal: confirmedTotal ?? totals.total,
      });
      // Keep a new address for next time (an order never fails because of this)
      if (isNewAddress && saveAddress) {
        const { fullName, phone, ...address } = shipping; // eslint-disable-line no-unused-vars
        addAddress({ ...address, label: '', isDefault: !addresses?.length }).catch(() => {});
      }
      clearCart();
      navigate(localePath(`/orders/${order.reference}`), { replace: true, state: { order, justPlaced: true } });
    } catch (error) {
      setPlacing(false);
      if (error.status === 409) {
        const priceChange = error.errors?.find((e) => e.reason === 'priceChanged');
        if (priceChange) {
          setConfirmedTotal(priceChange.total);
          setNotice(t('shop.checkout.priceChanged', { total: formatPrice(priceChange.total, lang) }));
        } else {
          applyCartChanges(error.errors || []);
        }
        return;
      }
      const { message, fieldErrors } = readApiError(error, t);
      setErrors(fieldErrors);
      setServerError(message);
      focusFirstInvalid(formRef.current);
    }
  }

  // Nothing to buy (and not in the middle of placing an order)
  if (!items.length && !placing) {
    return (
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cocoa-100 text-cocoa-700">
          <ShoppingBag size={22} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold">{t('shop.checkout.emptyTitle')}</h1>
        {notice && <p className="mt-3 text-sm text-cocoa-700">{notice}</p>}
        <p className="mb-6 mt-2 text-cocoa-600">{t('shop.cart.emptyText')}</p>
        <Link
          to={localePath('/catalog')}
          className="inline-flex items-center justify-center rounded-full bg-cocoa-900 px-5 py-2.5 text-sm font-semibold text-cream hover:bg-cocoa-700"
        >
          {t('shop.cart.browse')}
        </Link>
      </section>
    );
  }

  const field = (name) => ({ name, value: form[name], onChange: handleChange, error: errors[name] });
  const deliveryLabel = (method) => (
    <span className="flex flex-wrap items-baseline justify-between gap-2">
      <span>
        <span className="block font-semibold text-cocoa-900">{t(`shop.checkout.methods.${method}.title`)}</span>
        <span className="text-cocoa-600">{t(`shop.checkout.methods.${method}.time`)}</span>
      </span>
      <span className="font-semibold text-cocoa-900">
        {calculateTotals(subtotal, method).shippingCost === 0
          ? t('shop.checkout.free')
          : formatPrice(SHIPPING_RATES[method], lang)}
      </span>
    </span>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-gold-700">{t('shop.checkout.eyebrow')}</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-cocoa-900 sm:text-4xl">{t('shop.checkout.title')}</h1>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Step number={1} title={t('shop.checkout.contactTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('auth.fields.name')} autoComplete="name" {...field('fullName')} />
              <FormField
                label={t('auth.fields.phone')}
                type="tel"
                autoComplete="tel"
                hint={t('shop.checkout.phoneHint')}
                {...field('phone')}
              />
            </div>
            <p className="mt-3 text-xs text-cocoa-600">{t('shop.checkout.emailNote', { email: user?.email || '' })}</p>
          </Step>

          <Step number={2} title={t('shop.checkout.addressTitle')}>
            {addresses === null ? (
              <p role="status" className="text-sm text-cocoa-600">
                {t('common.loading')}
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <ChoiceCard
                    key={address._id}
                    name="address"
                    value={address._id}
                    checked={addressChoice === address._id}
                    onChange={() => setAddressChoice(address._id)}
                  >
                    <span className="block font-semibold text-cocoa-900">
                      {address.label || address.street}
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-gold-300/50 px-2 py-0.5 text-xs font-semibold text-cocoa-900">
                          {t('shop.checkout.default')}
                        </span>
                      )}
                    </span>
                    {address.label && <span className="block">{address.street}</span>}
                    <span className="block">{cityLine(address)}</span>
                    <span className="block">{address.country}</span>
                  </ChoiceCard>
                ))}
                {addresses.length > 0 && (
                  <ChoiceCard
                    name="address"
                    value={NEW_ADDRESS}
                    checked={isNewAddress}
                    onChange={() => setAddressChoice(NEW_ADDRESS)}
                  >
                    <span className="font-semibold text-cocoa-900">{t('shop.checkout.newAddress')}</span>
                  </ChoiceCard>
                )}

                {isNewAddress && (
                  <div className="space-y-4 pt-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        className="sm:col-span-2"
                        label={t('auth.fields.street')}
                        autoComplete="street-address"
                        {...field('street')}
                      />
                      <FormField label={t('auth.fields.city')} autoComplete="address-level2" {...field('city')} />
                      <FormField
                        label={t('auth.fields.state')}
                        autoComplete="address-level1"
                        hint={t('auth.hints.optional')}
                        {...field('state')}
                      />
                      <FormField label={t('auth.fields.postalCode')} autoComplete="postal-code" {...field('postalCode')} />
                      <FormField label={t('auth.fields.country')} autoComplete="country-name" {...field('country')} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-cocoa-800">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-cocoa-400 accent-cocoa-900 focus:ring-gold-400"
                      />
                      {t('shop.checkout.saveAddress')}
                    </label>
                  </div>
                )}
              </div>
            )}
          </Step>

          <Step number={3} title={t('shop.checkout.deliveryTitle')}>
            <div className="space-y-3">
              {SHIPPING_METHODS.map((method) => (
                <ChoiceCard
                  key={method}
                  name="shippingMethod"
                  value={method}
                  checked={shippingMethod === method}
                  onChange={() => setShippingMethod(method)}
                >
                  {deliveryLabel(method)}
                </ChoiceCard>
              ))}
            </div>
            {toFree > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-cocoa-700">
                <Truck size={14} aria-hidden="true" />
                {t('shop.checkout.freeShippingHint', { amount: formatPrice(toFree, lang) })}
              </p>
            )}
          </Step>

          <Step number={4} title={t('shop.checkout.paymentTitle')}>
            <ChoiceCard name="paymentMethod" value="payOnDelivery" checked onChange={() => {}}>
              <span className="flex items-start gap-3">
                <Banknote size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-cocoa-700" />
                <span>
                  <span className="block font-semibold text-cocoa-900">{t('shop.checkout.payOnDelivery')}</span>
                  <span className="text-cocoa-600">{t('shop.checkout.payOnDeliveryText')}</span>
                </span>
              </span>
            </ChoiceCard>
          </Step>
        </div>

        {/* Order summary */}
        <aside aria-labelledby="checkout-summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-cocoa-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-baseline justify-between">
              <h2 id="checkout-summary" className="font-serif text-xl font-semibold text-cocoa-900">
                {t('shop.checkout.summaryTitle')}
              </h2>
              <button
                type="button"
                onClick={openCart}
                className="text-sm font-semibold text-gold-700 underline-offset-2 hover:underline"
              >
                {t('shop.checkout.editCart')}
              </button>
            </div>
            <div className="mt-2 max-h-72 overflow-y-auto pr-1">
              <OrderLines lines={lines} />
            </div>
            <div className="mt-3 border-t border-cocoa-200 pt-4">
              <OrderTotals totals={confirmedTotal !== null ? { ...totals, total: confirmedTotal } : totals} />
            </div>

            <div className="mt-5 space-y-3">
              {notice && (
                <div role="alert" className="rounded-lg bg-gold-300/40 px-3 py-2.5 text-sm text-cocoa-900">
                  {notice}
                </div>
              )}
              <Alert type="error">{serverError}</Alert>
              <Button type="submit" variant="gold" className="w-full" loading={placing}>
                <Lock size={16} aria-hidden="true" />
                {t('shop.checkout.placeOrder', { total: formatPrice(confirmedTotal ?? totals.total, lang) })}
              </Button>
              <p className="text-center text-xs text-cocoa-600">{t('shop.checkout.terms')}</p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
