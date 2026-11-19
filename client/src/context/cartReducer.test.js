/**
 * Unit tests for the cart reducer (run with: npm test)
 */
import { beforeEach, describe, expect, test } from 'vitest';
import {
  CART_ACTIONS,
  CART_STORAGE_KEY,
  cartItemCount,
  cartReducer,
  cartSubtotal,
  emptyCart,
  loadStoredCart,
  storeCart,
} from './cartReducer';

const bar = { _id: 'p-1', slug: 'bar', name: { en: 'Bar', es: 'Tableta' }, price: 9.75, stock: 5, cacaoPct: 70 };
const box = { _id: 'p-2', slug: 'box', name: { en: 'Box', es: 'Caja' }, price: 32, stock: 50, cacaoPct: 66 };
const soldOut = { ...bar, _id: 'p-3', stock: 0 };

const add = (state, product, quantity) => cartReducer(state, { type: CART_ACTIONS.ADD, product, quantity });

describe('ADD', () => {
  test('adds a new line with a product snapshot', () => {
    const state = add(emptyCart, bar, 2);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ productId: 'p-1', quantity: 2, product: { price: 9.75, slug: 'bar' } });
  });

  test('adding the same product again raises the quantity', () => {
    const state = add(add(emptyCart, bar, 1), bar, 2);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
  });

  test('never goes above the stock', () => {
    const state = add(add(emptyCart, bar, 4), bar, 4);
    expect(state.items[0].quantity).toBe(5);
  });

  test('a sold-out product is not added', () => {
    expect(add(emptyCart, soldOut, 1)).toBe(emptyCart);
  });
});

describe('UPDATE and REMOVE', () => {
  test('sets a new quantity, limited to the stock', () => {
    let state = add(emptyCart, bar, 1);
    state = cartReducer(state, { type: CART_ACTIONS.UPDATE, productId: 'p-1', quantity: 3 });
    expect(state.items[0].quantity).toBe(3);
    state = cartReducer(state, { type: CART_ACTIONS.UPDATE, productId: 'p-1', quantity: 40 });
    expect(state.items[0].quantity).toBe(5);
  });

  test('quantity 0 removes the line', () => {
    const state = cartReducer(add(emptyCart, bar, 1), { type: CART_ACTIONS.UPDATE, productId: 'p-1', quantity: 0 });
    expect(state.items).toEqual([]);
  });

  test('REMOVE takes the line out', () => {
    let state = add(add(emptyCart, bar, 1), box, 1);
    state = cartReducer(state, { type: CART_ACTIONS.REMOVE, productId: 'p-1' });
    expect(state.items.map((line) => line.productId)).toEqual(['p-2']);
  });
});

describe('CLEAR and REPLACE', () => {
  test('CLEAR empties the cart and can change the owner', () => {
    const state = cartReducer({ owner: 'u1', items: add(emptyCart, bar, 1).items }, { type: CART_ACTIONS.CLEAR, owner: null });
    expect(state).toEqual({ owner: null, items: [] });
  });

  test('REPLACE takes server lines and drops broken ones', () => {
    const state = cartReducer(emptyCart, {
      type: CART_ACTIONS.REPLACE,
      owner: 'u1',
      items: [
        { productId: 'p-2', quantity: 2, product: box },
        { productId: 'p-9', quantity: 1 }, // no product details -> dropped
      ],
    });
    expect(state.owner).toBe('u1');
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ productId: 'p-2', quantity: 2 });
  });
});

describe('totals', () => {
  test('counts units and adds prices without rounding errors', () => {
    const state = add(add(emptyCart, bar, 3), box, 1); // 3 x 9.75 + 32
    expect(cartItemCount(state.items)).toBe(4);
    expect(cartSubtotal(state.items)).toBe(61.25);
  });
});

describe('localStorage', () => {
  beforeEach(() => localStorage.clear());

  test('a stored cart is loaded back', () => {
    storeCart(add(emptyCart, box, 2));
    expect(loadStoredCart().items[0]).toMatchObject({ productId: 'p-2', quantity: 2 });
  });

  test('damaged data gives an empty cart instead of an error', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json');
    expect(loadStoredCart()).toEqual(emptyCart);
  });
});
