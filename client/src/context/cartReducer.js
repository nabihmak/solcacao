/**
 * cartReducer - all shopping-cart state changes in one pure function (Student 3).
 * Kept apart from CartContext so it is easy to unit test (cartReducer.test.js).
 *
 * State shape:
 *   {
 *     owner: null | userId,   // null = guest cart; userId = cart synced with that account
 *     items: [{ productId, quantity, product }]
 *   }
 * "product" is a snapshot of what the drawer needs (name, price, slug, stock...), so the
 * cart shows instantly after a reload without asking the server first.
 *
 * Actions:
 *   ADD      { product, quantity }   add, or raise the quantity of an existing line
 *   UPDATE   { productId, quantity } set a quantity (0 or less removes the line)
 *   REMOVE   { productId }
 *   CLEAR    { owner? }              empty the cart (optionally change the owner)
 *   REPLACE  { items, owner }        take the cart the server sent back
 */
export const MAX_QTY = 99;

export const CART_ACTIONS = {
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
  REPLACE: 'REPLACE',
};

export const emptyCart = { owner: null, items: [] };

// The fields the cart keeps from a full product object
export function productSnapshot(product) {
  const { _id, slug, name, price, cacaoPct, origin, category, stock, weightGrams } = product;
  return { _id, slug, name, price, cacaoPct, origin, category, stock, weightGrams };
}

// Never more than what is in stock, never more than MAX_QTY, never a fraction
export function clampQuantity(quantity, product) {
  const stockLimit = Number.isFinite(product?.stock) ? product.stock : MAX_QTY;
  const wanted = Math.floor(Number(quantity) || 0);
  return Math.max(0, Math.min(wanted, stockLimit, MAX_QTY));
}

export function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD: {
      const { product } = action;
      const quantity = action.quantity ?? 1;
      if (!product?._id || quantity < 1) return state;

      const existing = state.items.find((line) => line.productId === product._id);
      const nextQuantity = clampQuantity((existing?.quantity || 0) + quantity, product);
      if (nextQuantity === 0) return state; // sold out
      if (existing) {
        if (existing.quantity === nextQuantity) return state; // already at the stock limit
        return {
          ...state,
          items: state.items.map((line) =>
            line.productId === product._id
              ? { ...line, quantity: nextQuantity, product: productSnapshot(product) }
              : line
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { productId: product._id, quantity: nextQuantity, product: productSnapshot(product) }],
      };
    }

    case CART_ACTIONS.UPDATE: {
      const line = state.items.find((item) => item.productId === action.productId);
      if (!line) return state;
      const quantity = clampQuantity(action.quantity, line.product);
      if (quantity === 0) return { ...state, items: state.items.filter((item) => item !== line) };
      if (quantity === line.quantity) return state;
      return {
        ...state,
        items: state.items.map((item) => (item === line ? { ...item, quantity } : item)),
      };
    }

    case CART_ACTIONS.REMOVE:
      return { ...state, items: state.items.filter((item) => item.productId !== action.productId) };

    case CART_ACTIONS.CLEAR:
      return { owner: action.owner !== undefined ? action.owner : state.owner, items: [] };

    case CART_ACTIONS.REPLACE:
      return {
        owner: action.owner !== undefined ? action.owner : state.owner,
        items: (action.items || [])
          .filter((line) => line.product && line.quantity > 0)
          .map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            product: productSnapshot(line.product),
          })),
      };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Derived values                                                      */
/* ------------------------------------------------------------------ */

export function cartItemCount(items) {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

// Rounded to cents to avoid floating-point leftovers such as 29.250000000000004
export function cartSubtotal(items) {
  const cents = items.reduce((sum, line) => sum + Math.round(line.product.price * 100) * line.quantity, 0);
  return cents / 100;
}

/* ------------------------------------------------------------------ */
/* localStorage persistence                                            */
/* ------------------------------------------------------------------ */

export const CART_STORAGE_KEY = 'solcacao_cart';

export function loadStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved?.items)) return emptyCart;
    // Throw away anything damaged instead of crashing the app
    return cartReducer({ owner: saved.owner ?? null, items: [] }, { type: CART_ACTIONS.REPLACE, items: saved.items });
  } catch {
    return emptyCart;
  }
}

export function storeCart(state) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked or full: the cart still works for this visit */
  }
}
