/**
 * Order model (Student 3 - checkout).
 * One document per placed order. Each line keeps a copy of the product name and price
 * at the moment of purchase, so later catalog changes never change an old order.
 * Money is stored in US dollars with two decimals (computed in cents, see routes/orders.js).
 */
import mongoose from 'mongoose';

export const ORDER_STATUSES = ['placed', 'shipped', 'delivered', 'cancelled'];
export const SHIPPING_METHODS = ['standard', 'express'];
export const PAYMENT_METHODS = ['payOnDelivery'];

const localizedText = { en: { type: String, default: '' }, es: { type: String, default: '' } };

const orderLineSchema = new mongoose.Schema(
  {
    productId: { type: String, ref: 'Product', required: true },
    sku: { type: String, default: '' },
    slug: { type: String, default: '' },
    name: localizedText,
    origin: { type: String, default: '' },
    cacaoPct: { type: Number },
    category: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100, default: '' },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true }, // e.g. SC-ORD-2026-7K3F9Q
    user: { type: String, required: true, index: true }, // the signed-in user's id
    items: { type: [orderLineSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    shippingMethod: { type: String, enum: SHIPPING_METHODS, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
  },
  { timestamps: true, versionKey: false }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
