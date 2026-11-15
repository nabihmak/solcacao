/**
 * Inventory model (Student 3).
 * One row per product with the units in stock. Kept separate from Product so
 * stock can change often without touching catalog data.
 */
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: { type: String, ref: 'Product', required: true, unique: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 }, // drives the "low stock" badge
  },
  { timestamps: true, versionKey: false }
);

export const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
