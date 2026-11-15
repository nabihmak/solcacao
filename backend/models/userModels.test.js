// Tests for Student 1's User and Address models. Run: npm test
// validate() checks the schema rules (and the B2B company rule) without a database connection.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User } from './User.js';
import { Address } from './Address.js';

const errorsOf = async (doc) => Object.keys((await doc.validate().catch((error) => error))?.errors || {}).sort();

const retail = { name: 'Ana López', email: 'Ana@Example.com', passwordHash: 'x'.repeat(60), accountType: 'Retail' };
const company = { companyName: 'Grand Hotel Lima', industry: 'Hotel' };

test('a valid retail user passes; email is stored in lower case', async () => {
  const user = new User(retail);
  assert.deepEqual(await errorsOf(user), []);
  assert.equal(user.email, 'ana@example.com');
  assert.equal(user.corporatePartner, null);
  assert.equal(user.preferredLanguage, 'en');
});

test('name, email and password hash are required', async () => {
  assert.deepEqual(await errorsOf(new User({ accountType: 'Retail' })), ['email', 'name', 'passwordHash']);
});

test('account type and language must be one of the allowed values', async () => {
  assert.deepEqual(await errorsOf(new User({ ...retail, accountType: 'Admin', preferredLanguage: 'fr' })), [
    'accountType',
    'preferredLanguage',
  ]);
});

test('a B2B user needs company details with a valid industry', async () => {
  assert.deepEqual(await errorsOf(new User({ ...retail, accountType: 'B2B' })), ['corporatePartner']);
  assert.deepEqual(await errorsOf(new User({ ...retail, accountType: 'B2B', corporatePartner: company })), []);
  const badIndustry = new User({ ...retail, accountType: 'B2B', corporatePartner: { ...company, industry: 'Space' } });
  assert.deepEqual(await errorsOf(badIndustry), ['corporatePartner.industry']);
});

test('a retail user never keeps company details', async () => {
  const user = new User({ ...retail, corporatePartner: company });
  await user.validate();
  assert.equal(user.corporatePartner, null);
});

test('the password hash is hidden from queries by default', async () => {
  assert.equal(User.schema.path('passwordHash').options.select, false);
});

test('email has a unique index', async () => {
  assert.equal(User.schema.path('email').options.unique, true);
});

test('an address needs its owner, street, city, postal code and country', async () => {
  assert.deepEqual(await errorsOf(new Address({ label: 'Home' })), [
    'city',
    'country',
    'postalCode',
    'street',
    'userId',
  ]);
  const address = new Address({
    userId: new mongoose.Types.ObjectId(),
    street: '123 Cacao Street',
    city: 'Austin',
    postalCode: '78701',
    country: 'United States',
  });
  assert.deepEqual(await errorsOf(address), []);
  assert.equal(address.isDefault, false);
});
