/**
 * Cart model (Student 3).
 * One saved cart per signed-in user. Only product ids and quantities are stored;
 * prices and stock are always read from Product and Inventory.
 */
import mongoose from 'mongoose';

export const MAX_QTY_PER_ITEM = 99;
export const MAX_CART_LINES = 50;

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, ref: 'Product', required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_QTY_PER_ITEM,
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, unique: true }, // the signed-in user's id
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_CART_LINES,
        message: `A cart can hold up to ${MAX_CART_LINES} products`,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
