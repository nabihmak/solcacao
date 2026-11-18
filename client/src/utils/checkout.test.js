import { describe, expect, test } from 'vitest';
import {
  amountToFreeShipping,
  buildShipping,
  calculateTotals,
  cityLine,
  validateCheckoutForm,
} from './checkout';

describe('calculateTotals (must match backend/routes/orders.js)', () => {
  test('standard shipping and 8.25% tax under $50', () => {
    expect(calculateTotals(19, 'standard')).toEqual({ subtotal: 19, shippingCost: 5.95, tax: 1.57, total: 26.52 });
  });
  test('free standard shipping from $50, express always charged', () => {
    expect(calculateTotals(50, 'standard').shippingCost).toBe(0);
    expect(calculateTotals(80, 'express').shippingCost).toBe(14.95);
  });
  test('amount left for free shipping', () => {
    expect(amountToFreeShipping(41.5)).toBe(8.5);
    expect(amountToFreeShipping(60)).toBe(0);
  });
});

describe('validateCheckoutForm', () => {
  const empty = { fullName: '', street: '', city: '', postalCode: '', country: '' };
  test('a new address needs street, city, postal code and country', () => {
    expect(Object.keys(validateCheckoutForm(empty, { newAddress: true }))).toEqual([
      'fullName', 'street', 'city', 'postalCode', 'country',
    ]);
  });
  test('a saved address only needs the name', () => {
    expect(validateCheckoutForm({ ...empty, fullName: 'Ana' }, { newAddress: false })).toEqual({});
  });
});

describe('buildShipping', () => {
  const form = { fullName: ' Ana ', phone: '', street: 'typed', city: 'X', state: '', postalCode: '1', country: 'Y' };
  test('uses the saved address when one is chosen, with the contact details from the form', () => {
    const saved = { street: '701 S Nedderman Dr', city: 'Arlington', state: 'TX', postalCode: '76019', country: 'United States' };
    expect(buildShipping(form, saved)).toEqual({ fullName: 'Ana', phone: '', ...saved });
  });
  test('uses the typed address otherwise', () => {
    expect(buildShipping(form, null).street).toBe('typed');
  });
});

test('cityLine', () => {
  expect(cityLine({ city: 'Arlington', state: 'TX', postalCode: '76019' })).toBe('Arlington, TX 76019');
  expect(cityLine({ city: 'Lima', state: '', postalCode: '15001' })).toBe('Lima, 15001');
});
