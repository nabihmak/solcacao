/**
 * mockApi.js - PHASE 2 ONLY: a stand-in for the back-end API.
 *
 * The syllabus puts the Node/Express API and the MySQL database in Phase 3,
 * so in Phase 2 the React app keeps its data in the browser (localStorage).
 * Every function here answers like the planned REST endpoint will:
 *   - same success data   ({ token, user }, { addresses }, ...)
 *   - same errors          (status 400 + field errors, 401, 404, 409)
 * In Phase 3, authService.js and userService.js switch to fetch('/api/...')
 * and this file is deleted. No component has to change.
 *
 * Demo accounts (created on first load):
 *   ana@example.com        / Cacao2026  (Personal / Retail)
 *   carlos@grandhotel.com  / Hotel2026  (Corporate / B2B)
 */
import * as rules from '../utils/validation';
import { INDUSTRIES, LANGUAGES } from '../utils/constants';

const DB_KEY = 'solcacao_mock_db';
const DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 300; // short pause so loading states are visible

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Same error shape the real API client will throw: error.status + error.errors
function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

// Turns { field: 'auth.errors.x' } from the validation helpers into a 400 error
function throwIfInvalid(checks) {
  const failed = rules.collectErrors(checks);
  const errors = Object.entries(failed).map(([field, key]) => ({ field, message: key }));
  if (errors.length) throw apiError(400, 'Validation failed', errors);
}

// Passwords are stored as SHA-256 hashes, never as plain text (the real API will use Bcrypt)
async function hashPassword(password) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Removes private fields before a user leaves the "server"
function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return { ...rest };
}

/* ------------------------------------------------------------------ */
/* Browser "database"                                                  */
/* ------------------------------------------------------------------ */

let memoryDb = null; // used when localStorage is not available

function readDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : memoryDb;
  } catch {
    return memoryDb;
  }
}

function writeDb(db) {
  memoryDb = db;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* keep the in-memory copy */
  }
}

// Loads the data, creating the demo accounts the first time
async function loadDb() {
  const existing = readDb();
  if (existing) return existing;

  const now = new Date().toISOString();
  const db = {
    users: [
      {
        _id: 'demo-ana',
        name: 'Ana López',
        email: 'ana@example.com',
        passwordHash: await hashPassword('Cacao2026'),
        accountType: 'Retail',
        phone: '',
        preferredLanguage: 'en',
        corporatePartner: null,
        createdAt: now,
      },
      {
        _id: 'demo-carlos',
        name: 'Carlos Ruiz',
        email: 'carlos@grandhotel.com',
        passwordHash: await hashPassword('Hotel2026'),
        accountType: 'B2B',
        phone: '',
        preferredLanguage: 'es',
        corporatePartner: { companyName: 'Grand Hotel Lima', industry: 'Hotel', taxId: '', website: '' },
        createdAt: now,
      },
    ],
    addresses: [
      {
        _id: 'demo-address-1',
        userId: 'demo-ana',
        label: 'Home',
        street: '123 Cacao Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'United States',
        isDefault: true,
        createdAt: now,
      },
    ],
    sessions: {}, // token -> user id
  };
  writeDb(db);
  return db;
}

// Finds the signed-in user for a token, like the real "protect" middleware
async function requireUser(token) {
  const db = await loadDb();
  const userId = token && db.sessions[token];
  const user = userId && db.users.find((u) => u._id === userId);
  if (!user) throw apiError(401, 'Not authorized: please sign in again');
  return { db, user };
}

function startSession(db, user) {
  const token = `mock-${newId()}`;
  db.sessions[token] = user._id;
  writeDb(db);
  return { token, user: publicUser(user) };
}

/* ------------------------------------------------------------------ */
/* Auth (planned: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me) */
/* ------------------------------------------------------------------ */

export async function register(payload) {
  await wait(DELAY_MS);
  const isB2B = payload.accountType === 'B2B';
  const company = payload.company || {};

  throwIfInvalid({
    name: rules.required(payload.name),
    email: rules.email(payload.email || ''),
    password: rules.password(payload.password || ''),
    accountType: ['Retail', 'B2B'].includes(payload.accountType) ? null : 'auth.errors.required',
    'company.companyName': isB2B ? rules.required(company.companyName) : null,
    'company.industry': isB2B && !INDUSTRIES.includes(company.industry) ? 'auth.errors.required' : null,
    'company.website': isB2B ? rules.website(company.website) : null,
  });

  const db = await loadDb();
  const email = payload.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) {
    throw apiError(409, 'An account with this email already exists');
  }

  const user = {
    _id: newId(),
    name: payload.name.trim(),
    email,
    passwordHash: await hashPassword(payload.password),
    accountType: payload.accountType,
    phone: (payload.phone || '').trim(),
    preferredLanguage: LANGUAGES.includes(payload.preferredLanguage) ? payload.preferredLanguage : 'en',
    corporatePartner: isB2B
      ? {
          companyName: company.companyName.trim(),
          industry: company.industry,
          taxId: (company.taxId || '').trim(),
          website: (company.website || '').trim(),
        }
      : null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  return startSession(db, user); // 201 Created in the real API
}

export async function login(email, password) {
  await wait(DELAY_MS);
  throwIfInvalid({ email: rules.email(email || ''), password: rules.required(password) });

  const db = await loadDb();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  // Same message for "no account" and "wrong password"
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw apiError(401, 'Invalid email or password');
  }
  return startSession(db, user); // 200 OK in the real API
}

export async function getMe(token) {
  await wait(DELAY_MS);
  const { user } = await requireUser(token);
  return { user: publicUser(user) };
}

export async function logout(token) {
  const db = await loadDb();
  delete db.sessions[token];
  writeDb(db);
}

/* ------------------------------------------------------------------ */
/* Profile (planned: PUT /api/users/profile, PUT /api/users/password)  */
/* ------------------------------------------------------------------ */

export async function updateProfile(token, changes) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);

  if (changes.company && user.accountType !== 'B2B') {
    throw apiError(400, 'Only B2B accounts have company details');
  }
  throwIfInvalid({
    name: changes.name !== undefined ? rules.required(changes.name) : null,
    preferredLanguage:
      changes.preferredLanguage !== undefined && !LANGUAGES.includes(changes.preferredLanguage)
        ? 'auth.errors.required'
        : null,
    'company.companyName': changes.company ? rules.required(changes.company.companyName) : null,
    'company.website': changes.company ? rules.website(changes.company.website) : null,
  });

  // Only these fields can change; email and account type stay the same
  if (changes.name !== undefined) user.name = changes.name.trim();
  if (changes.phone !== undefined) user.phone = changes.phone.trim();
  if (changes.preferredLanguage !== undefined) user.preferredLanguage = changes.preferredLanguage;
  if (changes.company) user.corporatePartner = { ...user.corporatePartner, ...changes.company };

  writeDb(db);
  return { user: publicUser(user) };
}

export async function changePassword(token, currentPassword, newPassword) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);

  throwIfInvalid({ currentPassword: rules.required(currentPassword), newPassword: rules.password(newPassword || '') });
  if (user.passwordHash !== (await hashPassword(currentPassword))) {
    throw apiError(400, 'Current password is incorrect');
  }
  user.passwordHash = await hashPassword(newPassword);
  writeDb(db);
  return { message: 'Password changed successfully' };
}

/* ------------------------------------------------------------------ */
/* Addresses (planned: GET/POST /api/users/addresses, PUT/DELETE /api/users/addresses/:id) */
/* ------------------------------------------------------------------ */

const ADDRESS_FIELDS = ['label', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault'];

function validateAddress(values, { partial }) {
  const check = (field) => (partial && values[field] === undefined ? null : rules.required(values[field]));
  throwIfInvalid({
    street: check('street'),
    city: check('city'),
    postalCode: check('postalCode'),
    country: check('country'),
  });
}

// Only one default address per user
function keepOneDefault(db, userId, defaultId) {
  db.addresses.forEach((a) => {
    if (a.userId === userId) a.isDefault = a._id === defaultId;
  });
}

function listFor(db, userId) {
  return db.addresses
    .filter((a) => a.userId === userId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt.localeCompare(b.createdAt));
}

export async function getAddresses(token) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);
  return { addresses: listFor(db, user._id) };
}

export async function addAddress(token, values) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);
  validateAddress(values, { partial: false });

  const isFirst = !db.addresses.some((a) => a.userId === user._id);
  const address = { _id: newId(), userId: user._id, createdAt: new Date().toISOString() };
  ADDRESS_FIELDS.forEach((field) => {
    address[field] = values[field] ?? (field === 'isDefault' ? false : '');
  });
  address.isDefault = isFirst || Boolean(values.isDefault); // the first address becomes the default
  db.addresses.push(address);
  if (address.isDefault) keepOneDefault(db, user._id, address._id);

  writeDb(db);
  return { address };
}

export async function updateAddress(token, id, values) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);
  const address = db.addresses.find((a) => a._id === id && a.userId === user._id);
  if (!address) throw apiError(404, 'Address not found');
  validateAddress(values, { partial: true });

  ADDRESS_FIELDS.forEach((field) => {
    if (values[field] !== undefined) address[field] = values[field];
  });
  if (address.isDefault) keepOneDefault(db, user._id, address._id);

  writeDb(db);
  return { address };
}

export async function deleteAddress(token, id) {
  await wait(DELAY_MS);
  const { db, user } = await requireUser(token);
  const index = db.addresses.findIndex((a) => a._id === id && a.userId === user._id);
  if (index === -1) throw apiError(404, 'Address not found');

  const [removed] = db.addresses.splice(index, 1);
  if (removed.isDefault) {
    const next = listFor(db, user._id)[0]; // oldest remaining address becomes the default
    if (next) next.isDefault = true;
  }
  writeDb(db);
  return { message: 'Address deleted' };
}

// Used by the unit tests to start from a clean, freshly seeded store
export function resetMockDb() {
  memoryDb = null;
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
}
