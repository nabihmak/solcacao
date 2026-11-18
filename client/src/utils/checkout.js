/**
 * Checkout helpers (Student 3).
 * The totals here are only what the shopper sees before ordering. The server works
 * them out again from database prices (backend/routes/orders.js) - keep both in step.
 */
import { collectErrors, required } from './validation';

export const SHIPPING_RATES = { standard: 5.95, express: 14.95 };
export const FREE_SHIPPING_FROM = 50;
export const TAX_RATE = 0.0825; // Texas sales tax
export const SHIPPING_METHODS = ['standard', 'express'];

const toCents = (amount) => Math.round(Number(amount) * 100);

/** Subtotal, shipping, tax and total in dollars, added up in cents. */
export function calculateTotals(subtotal, shippingMethod = 'standard') {
  const subtotalCents = toCents(subtotal);
  let shippingCents = toCents(SHIPPING_RATES[shippingMethod] ?? SHIPPING_RATES.standard);
  if (shippingMethod === 'standard' && subtotalCents >= toCents(FREE_SHIPPING_FROM)) shippingCents = 0;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotal: subtotalCents / 100,
    shippingCost: shippingCents / 100,
    tax: taxCents / 100,
    total: (subtotalCents + shippingCents + taxCents) / 100,
  };
}

// How much more for free standard shipping (0 when already free)
export function amountToFreeShipping(subtotal) {
  return Math.max(0, (toCents(FREE_SHIPPING_FROM) - toCents(subtotal)) / 100);
}

/** Client-side check of the checkout form. Returns { field: translationKey }. */
export function validateCheckoutForm(form, { newAddress }) {
  return collectErrors({
    fullName: required(form.fullName),
    ...(newAddress
      ? {
          street: required(form.street),
          city: required(form.city),
          postalCode: required(form.postalCode),
          country: required(form.country),
        }
      : {}),
  });
}

/** The shipping block sent to the API, from a saved address or the form. */
export function buildShipping(form, savedAddress) {
  const source = savedAddress || form;
  const pick = (value) => String(value ?? '').trim();
  return {
    fullName: pick(form.fullName),
    phone: pick(form.phone),
    street: pick(source.street),
    city: pick(source.city),
    state: pick(source.state),
    postalCode: pick(source.postalCode),
    country: pick(source.country),
  };
}

/** One line of an address for display: "Arlington, TX 76019". */
export function cityLine({ city, state, postalCode }) {
  return [city, [state, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}
