/**
 * CartContext - global shopping-cart state (Student 3).
 *
 * Any component can read and change the cart:
 *   const { items, itemCount, subtotal, addItem, updateQuantity, removeItem, openCart } = useCart();
 *
 * How the cart is kept:
 *  - State lives in a useReducer (see cartReducer.js) and is copied to localStorage on
 *    every change, so a guest cart survives a page reload.
 *  - Guest -> signs in: the guest cart is merged into the cart saved on the account
 *    (POST /api/cart/merge). This is the "guest session merging" from the blueprint, and
 *    it is why AuthContext does not need to call us: we watch useAuth().user instead.
 *  - Signed in: every change is saved to the account a moment later
 *    (POST /api/cart/persist), and a reload fetches the saved cart (GET /api/cart).
 *  - Signs out: the cart on this device is emptied (it stays saved on the account).
 *
 * Must be placed inside <AuthProvider>.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { loadSavedCart, mergeGuestCart, saveCart } from '../services/cartService';
import {
  CART_ACTIONS,
  cartItemCount,
  cartReducer,
  cartSubtotal,
  emptyCart,
  loadStoredCart,
  storeCart,
} from './cartReducer';

const CartContext = createContext(null);
const SAVE_DELAY_MS = 400; // wait for quick +/- clicks to finish before saving

// A short fingerprint of the cart, used to skip saves that would change nothing
const fingerprint = (items) => items.map((line) => `${line.productId}:${line.quantity}`).join(',');

export function CartProvider({ children }) {
  const { user, status } = useAuth();
  const userId = user?._id ?? null;

  const [state, dispatch] = useReducer(cartReducer, emptyCart, loadStoredCart);
  const [isCartOpen, setCartOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error
  const [notice, setNotice] = useState(null); // translation key shown in the drawer
  const [lastAdded, setLastAdded] = useState(null); // product name for the screen-reader message

  const lastSynced = useRef(null); // fingerprint of the cart the server last confirmed
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Keep a copy in the browser
  useEffect(() => {
    storeCart(state);
  }, [state]);

  // Applies a cart that came back from the server
  const applyServerCart = useCallback((response, owner) => {
    lastSynced.current = fingerprint(response.cart.items);
    dispatch({ type: CART_ACTIONS.REPLACE, items: response.cart.items, owner });
    if (response.adjustments?.length) setNotice('shop.cart.adjusted');
    setSyncStatus('saved');
  }, []);

  // 2. React to sign-in, sign-out and page reloads
  const syncedUser = useRef(null); // the account whose cart was already loaded or merged
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (status === 'loading') return; // still checking a saved token
    const current = stateRef.current;

    if (!userId) {
      // Signed out (or never signed in): a cart that belonged to an account is cleared here
      syncedUser.current = null;
      lastSynced.current = null;
      if (current.owner !== null) dispatch({ type: CART_ACTIONS.CLEAR, owner: null });
      setSyncStatus('idle');
      return;
    }

    // Run once per sign-in. (React StrictMode runs effects twice in development, and
    // merging twice would double the guest quantities.)
    if (syncedUser.current === userId) return;
    syncedUser.current = userId;

    setSyncStatus('saving');
    const guestItems = current.owner === null ? current.items : [];
    const request =
      current.owner === userId
        ? loadSavedCart() // page reload: the account copy is the source of truth
        : mergeGuestCart(guestItems); // fresh sign-in: add the guest cart to the account

    request
      .then((response) => {
        if (userIdRef.current === userId) applyServerCart(response, userId);
      })
      .catch(() => {
        if (userIdRef.current !== userId) return;
        // Keep shopping with the local cart; the next change will try to save again
        if (current.owner !== userId) dispatch({ type: CART_ACTIONS.REPLACE, items: guestItems, owner: userId });
        setSyncStatus('error');
      });
  }, [userId, status, applyServerCart]);

  // 3. Save changes to the account (signed-in users only)
  useEffect(() => {
    if (!userId || state.owner !== userId) return undefined;
    if (fingerprint(state.items) === lastSynced.current) return undefined;

    setSyncStatus('saving');
    const timer = setTimeout(() => {
      saveCart(state.items)
        .then((response) => {
          lastSynced.current = fingerprint(response.cart.items);
          // Only overwrite local state when the server had to change something (stock)
          if (response.adjustments?.length) applyServerCart(response, userId);
          setSyncStatus('saved');
        })
        .catch(() => setSyncStatus('error'));
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [state.items, state.owner, userId, applyServerCart]);

  /* ---------------- Actions ---------------- */

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const addItem = useCallback((product, quantity = 1, { open = true } = {}) => {
    dispatch({ type: CART_ACTIONS.ADD, product, quantity });
    setLastAdded({ name: product.name, at: Date.now() });
    if (open) setCartOpen(true);
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE, productId, quantity });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.REMOVE, productId });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: CART_ACTIONS.CLEAR }), []);

  const value = useMemo(
    () => ({
      items: state.items,
      itemCount: cartItemCount(state.items),
      subtotal: cartSubtotal(state.items),
      quantityOf: (productId) => state.items.find((line) => line.productId === productId)?.quantity || 0,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncStatus,
      notice,
      dismissNotice,
      lastAdded,
    }),
    [state.items, isCartOpen, openCart, closeCart, addItem, updateQuantity, removeItem, clearCart, syncStatus, notice, dismissNotice, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
