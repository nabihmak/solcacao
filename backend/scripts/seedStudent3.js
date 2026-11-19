/**
 * seedStudent3.js - loads the catalog into MongoDB (Student 3).
 *
 * Reads the 18 products and their stock from the Phase 2 data file
 * (client/src/data/products.js) and replaces the products and inventories
 * collections. Users, carts, B2B quotes and other collections are not touched.
 *
 * Run from backend/:  node scripts/seedStudent3.js
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connectMongoose, disconnectMongoose } from '../config/mongoose.js';
import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { PRODUCTS, INVENTORY } from '../../client/src/data/products.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env') });

async function seed() {
  await connectMongoose();

  await Product.deleteMany({});
  await Inventory.deleteMany({});

  // create() runs validation and fills searchText for each product
  await Product.create(PRODUCTS.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })));
  await Inventory.create(
    INVENTORY.map((row) => ({ product: row.productId, stock: row.stock, lowStockThreshold: row.lowStockThreshold }))
  );
  await Promise.all([Product.syncIndexes(), Inventory.syncIndexes()]);

  console.log(`Seeded ${PRODUCTS.length} products and ${INVENTORY.length} inventory rows`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectMongoose());
