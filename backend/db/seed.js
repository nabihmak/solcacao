/**
 * seed.js - adds the two demo accounts used in class (Student 1).
 * Run once after setting MONGO_CONNECTION_STRING in backend/.env:   npm run seed
 * Safe to run again: an account that already exists is skipped.
 *
 *   ana@example.com        / Cacao2026  (Personal / Retail, with one address)
 *   carlos@grandhotel.com  / Hotel2026  (Corporate / B2B, Grand Hotel Lima)
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectMongoose, disconnectMongoose } from '../config/mongoose.js';
import * as userStore from './userStore.js';

const DEMO_ACCOUNTS = [
  {
    name: 'Ana López',
    email: 'ana@example.com',
    password: 'Cacao2026',
    accountType: 'Retail',
    preferredLanguage: 'en',
    address: {
      label: 'Home',
      street: '123 Cacao Street',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'United States',
      isDefault: true,
    },
  },
  {
    name: 'Carlos Ruiz',
    email: 'carlos@grandhotel.com',
    password: 'Hotel2026',
    accountType: 'B2B',
    preferredLanguage: 'es',
    company: { companyName: 'Grand Hotel Lima', industry: 'Hotel', taxId: '', website: '' },
  },
];

try {
  await connectMongoose();
  for (const { password, address, ...account } of DEMO_ACCOUNTS) {
    if (await userStore.emailExists(account.email)) {
      console.log(`Skipped ${account.email} (already exists)`);
      continue;
    }
    const user = await userStore.createUser({
      ...account,
      phone: '',
      company: account.company || null,
      passwordHash: await bcrypt.hash(password, 10),
    });
    if (address) await userStore.addAddress(user._id, address);
    console.log(`Created ${account.email}`);
  }
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectMongoose();
}
