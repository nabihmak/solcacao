// Tests for Student 1's auth and profile routes. Run: npm test
// They use an in-memory store instead of MongoDB, so no database is needed.
import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { makeAuthRouter } from './auth.js';
import { makeUsersRouter } from './users.js';
import { makeProtect, requireB2B } from '../middleware/auth.js';

process.env.JWT_SECRET = 'test-secret';

// Same functions as db/userStore.js, kept in memory
function fakeStore() {
  let users = [];
  let addresses = [];
  let nextId = 1;
  const publicUser = ({ passwordHash, ...user }) => ({ ...user });
  const sorted = (userId) =>
    addresses.filter((a) => a.userId === userId).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.n - b.n);
  const out = ({ userId, n, ...address }) => ({ ...address });
  const keepOneDefault = (userId, id) => addresses.forEach((a) => a.userId === userId && (a.isDefault = a._id === id));

  return {
    async findUserById(id) {
      const user = users.find((u) => u._id === String(id));
      return user ? publicUser(user) : null;
    },
    async findUserByEmail(email) {
      const user = users.find((u) => u.email === email);
      return user ? { user: publicUser(user), passwordHash: user.passwordHash } : null;
    },
    async emailExists(email) {
      return users.some((u) => u.email === email);
    },
    async createUser({ company, ...values }) {
      const user = { _id: String(nextId++), ...values, corporatePartner: company, createdAt: new Date().toISOString() };
      users.push(user);
      return publicUser(user);
    },
    async updateUser(id, changes) {
      const user = users.find((u) => u._id === id);
      ['name', 'phone', 'preferredLanguage'].forEach((k) => changes[k] !== undefined && (user[k] = changes[k]));
      if (changes.company) {
        Object.entries(changes.company).forEach(([k, v]) => v !== undefined && (user.corporatePartner[k] = v));
      }
      return publicUser(user);
    },
    async getPasswordHash(id) {
      return users.find((u) => u._id === id).passwordHash;
    },
    async setPasswordHash(id, hash) {
      users.find((u) => u._id === id).passwordHash = hash;
    },
    async listAddresses(userId) {
      return sorted(userId).map(out);
    },
    async addAddress(userId, values) {
      const isDefault = !addresses.some((a) => a.userId === userId) || Boolean(values.isDefault);
      const address = { _id: String(nextId++), n: nextId, userId, ...values, isDefault };
      addresses.push(address);
      if (isDefault) keepOneDefault(userId, address._id);
      return out(address);
    },
    async updateAddress(userId, id, values) {
      const address = addresses.find((a) => a._id === id && a.userId === userId);
      if (!address) return null;
      Object.assign(address, values);
      if (address.isDefault) keepOneDefault(userId, id);
      return out(address);
    },
    async deleteAddress(userId, id) {
      const address = addresses.find((a) => a._id === id && a.userId === userId);
      if (!address) return false;
      addresses = addresses.filter((a) => a !== address);
      const [next] = sorted(userId);
      if (address.isDefault && next) next.isDefault = true;
      return true;
    },
    reset() {
      users = [];
      addresses = [];
    },
  };
}

const store = fakeStore();
const app = express();
app.use(express.json());
app.use('/api/auth', makeAuthRouter({ store }));
app.use('/api/users', makeUsersRouter({ store }));
app.get('/partners-only', makeProtect(store), requireB2B, (req, res) => res.json({ ok: true }));
const server = app.listen(0);
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

async function call(method, path, body, token) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const ana = { name: 'Ana López', email: 'Ana@Example.com', password: 'Cacao2026', accountType: 'Retail' };
const carlos = {
  name: 'Carlos Ruiz',
  email: 'carlos@grandhotel.com',
  password: 'Hotel2026',
  accountType: 'B2B',
  company: { companyName: 'Grand Hotel Lima', industry: 'Hotel', website: 'https://grandhotel.example' },
};
const fields = (body) => body.errors.map((e) => e.field).sort();

beforeEach(() => store.reset());

/* ---------------------------- Register ---------------------------- */

test('register returns 201 with a token and the user, without the password', async () => {
  const { status, body } = await call('POST', '/api/auth/register', ana);
  assert.equal(status, 201);
  assert.ok(body.token);
  assert.equal(body.user.email, 'ana@example.com'); // stored in lower case
  assert.equal(body.user.accountType, 'Retail');
  assert.equal(body.user.corporatePartner, null);
  assert.equal(body.user.passwordHash, undefined);
  assert.equal(jwt.verify(body.token, 'test-secret').sub, body.user._id);
});

test('passwords are stored as bcrypt hashes, never as plain text', async () => {
  await call('POST', '/api/auth/register', ana);
  const { passwordHash } = await store.findUserByEmail('ana@example.com');
  assert.notEqual(passwordHash, 'Cacao2026');
  assert.ok(await bcrypt.compare('Cacao2026', passwordHash));
});

test('register a B2B account saves the company details', async () => {
  const { status, body } = await call('POST', '/api/auth/register', carlos);
  assert.equal(status, 201);
  assert.equal(body.user.corporatePartner.companyName, 'Grand Hotel Lima');
});

test('register checks every field -> 400 with translation keys', async () => {
  const { status, body } = await call('POST', '/api/auth/register', {
    name: ' ',
    email: 'not-an-email',
    password: 'short',
    accountType: 'Admin',
  });
  assert.equal(status, 400);
  assert.deepEqual(fields(body), ['accountType', 'email', 'name', 'password']);
  assert.equal(body.errors.find((e) => e.field === 'password').message, 'auth.errors.passwordRules');
});

test('B2B register needs a company name and a valid industry and website', async () => {
  const { status, body } = await call('POST', '/api/auth/register', {
    ...carlos,
    company: { companyName: '', industry: 'Space', website: 'grandhotel' },
  });
  assert.equal(status, 400);
  assert.deepEqual(fields(body), ['company.companyName', 'company.industry', 'company.website']);
});

test('register with an email already in use -> 409', async () => {
  await call('POST', '/api/auth/register', ana);
  const { status } = await call('POST', '/api/auth/register', { ...ana, email: 'ana@example.com' });
  assert.equal(status, 409);
});

test('values that are not text are rejected, not crashed on', async () => {
  const { status } = await call('POST', '/api/auth/register', { ...ana, name: { $gt: '' }, password: 12345678 });
  assert.equal(status, 400);
});

/* ------------------------------ Login ------------------------------ */

test('login with the right password -> 200 with a token', async () => {
  await call('POST', '/api/auth/register', ana);
  const { status, body } = await call('POST', '/api/auth/login', { email: 'ANA@example.com', password: 'Cacao2026' });
  assert.equal(status, 200);
  assert.ok(body.token);
  assert.equal(body.user.name, 'Ana López');
});

test('wrong password and unknown email give the same 401 message', async () => {
  await call('POST', '/api/auth/register', ana);
  const wrong = await call('POST', '/api/auth/login', { email: 'ana@example.com', password: 'Wrong1234' });
  const unknown = await call('POST', '/api/auth/login', { email: 'nobody@example.com', password: 'Cacao2026' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);
});

test('login with empty fields -> 400', async () => {
  const { status, body } = await call('POST', '/api/auth/login', {});
  assert.equal(status, 400);
  assert.deepEqual(fields(body), ['email', 'password']);
});

/* --------------------------- Token checks --------------------------- */

test('/me returns the signed-in user', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const { status, body } = await call('GET', '/api/auth/me', null, session.token);
  assert.equal(status, 200);
  assert.equal(body.user.email, 'ana@example.com');
});

test('/me with no token, a fake token or an expired token -> 401', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const fake = jwt.sign({ sub: session.user._id }, 'someone-elses-secret');
  const expired = jwt.sign({ sub: session.user._id }, 'test-secret', { expiresIn: -10 });
  for (const token of [undefined, 'abc', fake, expired]) {
    assert.equal((await call('GET', '/api/auth/me', null, token)).status, 401);
  }
});

test('requireB2B lets partners through and blocks retail accounts with 403', async () => {
  const { body: retail } = await call('POST', '/api/auth/register', ana);
  const { body: partner } = await call('POST', '/api/auth/register', carlos);
  assert.equal((await call('GET', '/partners-only', null, retail.token)).status, 403);
  assert.equal((await call('GET', '/partners-only', null, partner.token)).status, 200);
  assert.equal((await call('GET', '/partners-only')).status, 401);
});

test('logout answers 204', async () => {
  assert.equal((await call('POST', '/api/auth/logout')).status, 204);
});

/* ----------------------------- Profile ----------------------------- */

test('profile update changes name, phone and language but never the email', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const { status, body } = await call(
    'PUT',
    '/api/users/profile',
    { name: 'Ana María', phone: '512-555-0100', preferredLanguage: 'es', email: 'hacker@example.com' },
    session.token
  );
  assert.equal(status, 200);
  assert.equal(body.user.name, 'Ana María');
  assert.equal(body.user.preferredLanguage, 'es');
  assert.equal(body.user.email, 'ana@example.com');
});

test('only B2B accounts can change company details', async () => {
  const { body: retail } = await call('POST', '/api/auth/register', ana);
  const { body: partner } = await call('POST', '/api/auth/register', carlos);
  const company = { companyName: 'Grand Hotel Cusco', industry: 'Hotel', website: '' };
  assert.equal((await call('PUT', '/api/users/profile', { company }, retail.token)).status, 400);
  const { body } = await call('PUT', '/api/users/profile', { company }, partner.token);
  assert.equal(body.user.corporatePartner.companyName, 'Grand Hotel Cusco');
});

test('profile routes need a token -> 401', async () => {
  assert.equal((await call('PUT', '/api/users/profile', { name: 'X' })).status, 401);
  assert.equal((await call('GET', '/api/users/addresses')).status, 401);
});

/* ----------------------------- Password ----------------------------- */

test('change password needs the current password, then the new one works', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const wrong = await call(
    'PUT',
    '/api/users/password',
    { currentPassword: 'nope', newPassword: 'Newpass2026' },
    session.token
  );
  assert.equal(wrong.status, 400);
  const weak = await call(
    'PUT',
    '/api/users/password',
    { currentPassword: 'Cacao2026', newPassword: 'short' },
    session.token
  );
  assert.deepEqual(fields(weak.body), ['newPassword']);
  const ok = await call(
    'PUT',
    '/api/users/password',
    { currentPassword: 'Cacao2026', newPassword: 'Newpass2026' },
    session.token
  );
  assert.equal(ok.status, 200);
  assert.equal(
    (await call('POST', '/api/auth/login', { email: 'ana@example.com', password: 'Newpass2026' })).status,
    200
  );
  assert.equal(
    (await call('POST', '/api/auth/login', { email: 'ana@example.com', password: 'Cacao2026' })).status,
    401
  );
});

/* ----------------------------- Addresses ----------------------------- */

const home = {
  label: 'Home',
  street: '123 Cacao Street',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  country: 'United States',
};
const work = {
  label: 'Work',
  street: '1 Main St',
  city: 'Dallas',
  state: 'TX',
  postalCode: '75201',
  country: 'United States',
};

test('first address becomes the default; a new default replaces the old one', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const first = await call('POST', '/api/users/addresses', home, session.token);
  assert.equal(first.status, 201);
  assert.equal(first.body.address.isDefault, true);
  await call('POST', '/api/users/addresses', { ...work, isDefault: true }, session.token);
  const { body } = await call('GET', '/api/users/addresses', null, session.token);
  assert.deepEqual(
    body.addresses.map((a) => [a.label, a.isDefault]),
    [
      ['Work', true],
      ['Home', false],
    ]
  );
});

test('address needs street, city, postal code and country', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const { status, body } = await call('POST', '/api/users/addresses', { label: 'Home' }, session.token);
  assert.equal(status, 400);
  assert.deepEqual(fields(body), ['city', 'country', 'postalCode', 'street']);
});

test('update and delete an address; deleting the default makes the next one default', async () => {
  const { body: session } = await call('POST', '/api/auth/register', ana);
  const { body: added } = await call('POST', '/api/users/addresses', home, session.token);
  await call('POST', '/api/users/addresses', work, session.token);
  const updated = await call(
    'PUT',
    `/api/users/addresses/${added.address._id}`,
    { city: 'San Antonio' },
    session.token
  );
  assert.equal(updated.body.address.city, 'San Antonio');
  assert.equal((await call('DELETE', `/api/users/addresses/${added.address._id}`, null, session.token)).status, 200);
  const { body } = await call('GET', '/api/users/addresses', null, session.token);
  assert.deepEqual(
    body.addresses.map((a) => [a.label, a.isDefault]),
    [['Work', true]]
  );
});

test("a user cannot change or delete someone else's address -> 404", async () => {
  const { body: anaSession } = await call('POST', '/api/auth/register', ana);
  const { body: carlosSession } = await call('POST', '/api/auth/register', carlos);
  const { body: added } = await call('POST', '/api/users/addresses', home, anaSession.token);
  const id = added.address._id;
  assert.equal((await call('PUT', `/api/users/addresses/${id}`, { city: 'X' }, carlosSession.token)).status, 404);
  assert.equal((await call('DELETE', `/api/users/addresses/${id}`, null, carlosSession.token)).status, 404);
  assert.equal((await call('DELETE', '/api/users/addresses/abc', null, anaSession.token)).status, 404);
});
