/**
 * Product model (Student 3).
 * One document per chocolate. Shopper-facing text is stored as { en, es } so the
 * catalog switches language without another request. Stock lives in Inventory.
 *
 * _id is a readable string ("p-001") so it matches the ids the front end and
 * saved carts already use.
 */
import mongoose from 'mongoose';

export const CATEGORIES = ['bar', 'truffles', 'seasonal'];

// Lowercase and strip accents, so "cafe" finds "Café" and "lucuma" finds "Lúcuma"
export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// One accent-free string with everything the search box should match
export function buildSearchText(product) {
  return normalizeText(
    [
      product.name?.en,
      product.name?.es,
      product.origin,
      product.region,
      product.category,
      product.sku,
      ...(product.tastingNotes?.en || []),
      ...(product.tastingNotes?.es || []),
    ].join(' ')
  );
}

const localized = (required) => ({
  en: { type: String, required, trim: true },
  es: { type: String, required, trim: true },
});

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sku: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: localized(true),
    description: localized(false),
    tastingNotes: {
      en: { type: [String], default: [] },
      es: { type: [String], default: [] },
    },
    category: { type: String, required: true, enum: CATEGORIES },
    origin: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    cacaoPct: { type: Number, required: true, min: 0, max: 100 },
    price: { type: Number, required: true, min: 0 }, // USD
    weightGrams: { type: Number, min: 0 },
    isOrganic: { type: Boolean, default: false },
    featuredRank: { type: Number, default: 999 }, // lower = shown first in "featured" sort
    createdAt: { type: Date, default: Date.now }, // release date, used by "newest" sort
    searchText: { type: String, select: false }, // filled automatically, used by search
  },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false }
);

productSchema.pre('validate', function setSearchText() {
  this.searchText = buildSearchText(this);
});

// Indexes for the catalog filters and sorts
productSchema.index({ origin: 1 });
productSchema.index({ category: 1 });
productSchema.index({ cacaoPct: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featuredRank: 1 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
