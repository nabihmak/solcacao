/**
 * userStore.js - every MongoDB query for users and addresses (Student 1).
 * The routes only call these functions, so the tests can swap in a fake store
 * and run without a database.
 *
 * Collections:
 *   users     { _id, name, email, passwordHash, accountType, phone, preferredLanguage,
 *               corporatePartner: { companyName, industry, taxId, website } | null, createdAt, updatedAt }
 *   addresses { _id, userId, label, street, city, state, postalCode, country, isDefault, createdAt }
 *
 * Objects leave this file in the shape the front end already uses: _id as a string,
 * dates as ISO text, and never the password hash.
 */
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';

const users = async () => (await getDb()).collection('users');
const addresses = async () => (await getDb()).collection('addresses');

// Turns an id from a URL or a token into an ObjectId, or null when it is not a valid id
const toObjectId = (id) => (ObjectId.isValid(String(id)) ? new ObjectId(String(id)) : null);

function toUser(doc) {
  return {
    _id: String(doc._id),
    name: doc.name,
    email: doc.email,
    accountType: doc.accountType,
    phone: doc.phone,
    preferredLanguage: doc.preferredLanguage,
    corporatePartner: doc.corporatePartner || null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

function toAddress(doc) {
  return {
    _id: String(doc._id),
    label: doc.label,
    street: doc.street,
    city: doc.city,
    state: doc.state,
    postalCode: doc.postalCode,
    country: doc.country,
    isDefault: Boolean(doc.isDefault),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

/* ---------------------------- Users ---------------------------- */

export async function findUserById(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await users()).findOne({ _id });
  return doc ? toUser(doc) : null;
}

// Also returns the password hash, for the login check only
export async function findUserByEmail(email) {
  const doc = await (await users()).findOne({ email });
  return doc ? { user: toUser(doc), passwordHash: doc.passwordHash } : null;
}

export async function emailExists(email) {
  return (await (await users()).countDocuments({ email }, { limit: 1 })) > 0;
}

// Throws an error with code 'EMAIL_TAKEN' if the email was registered at the same moment
export async function createUser({ name, email, passwordHash, accountType, phone, preferredLanguage, company }) {
  const now = new Date();
  const doc = {
    name,
    email,
    passwordHash,
    accountType,
    phone,
    preferredLanguage,
    corporatePartner: accountType === 'B2B' ? company : null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const { insertedId } = await (await users()).insertOne(doc);
    return toUser({ ...doc, _id: insertedId });
  } catch (error) {
    if (error.code === 11000) error.code = 'EMAIL_TAKEN'; // unique index on email
    throw error;
  }
}

// changes: { name?, phone?, preferredLanguage?, company? } (already validated)
export async function updateUser(id, changes) {
  const set = { updatedAt: new Date() };
  ['name', 'phone', 'preferredLanguage'].forEach((field) => {
    if (changes[field] !== undefined) set[field] = changes[field];
  });
  if (changes.company) {
    Object.entries(changes.company).forEach(([field, value]) => {
      if (value !== undefined) set[`corporatePartner.${field}`] = value;
    });
  }
  await (await users()).updateOne({ _id: toObjectId(id) }, { $set: set });
  return findUserById(id);
}

export async function getPasswordHash(id) {
  const doc = await (await users()).findOne({ _id: toObjectId(id) }, { projection: { passwordHash: 1 } });
  return doc?.passwordHash ?? null;
}

export async function setPasswordHash(id, passwordHash) {
  await (await users()).updateOne({ _id: toObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } });
}

/* -------------------------- Addresses -------------------------- */

// Default address first, then oldest first
export async function listAddresses(userId) {
  const docs = await (
    await addresses()
  )
    .find({ userId: toObjectId(userId) })
    .sort({ isDefault: -1, createdAt: 1, _id: 1 })
    .toArray();
  return docs.map(toAddress);
}

// Only one default address per user
async function keepOneDefault(userId, defaultId) {
  await (
    await addresses()
  ).updateMany({ userId: toObjectId(userId), _id: { $ne: defaultId } }, { $set: { isDefault: false } });
}

export async function addAddress(userId, values) {
  const collection = await addresses();
  const owner = toObjectId(userId);
  const isFirst = (await collection.countDocuments({ userId: owner }, { limit: 1 })) === 0;
  const doc = {
    userId: owner,
    label: values.label,
    street: values.street,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
    isDefault: isFirst || Boolean(values.isDefault), // the first address becomes the default
    createdAt: new Date(),
  };
  const { insertedId } = await collection.insertOne(doc);
  if (doc.isDefault) await keepOneDefault(userId, insertedId);
  return toAddress({ ...doc, _id: insertedId });
}

// Returns null when the address does not exist or belongs to someone else
export async function updateAddress(userId, id, values) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const set = {};
  ['label', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault'].forEach((field) => {
    if (values[field] !== undefined) set[field] = values[field];
  });
  const collection = await addresses();
  const filter = { _id, userId: toObjectId(userId) };
  const doc = Object.keys(set).length
    ? await collection.findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' })
    : await collection.findOne(filter);
  if (!doc) return null;
  if (doc.isDefault) await keepOneDefault(userId, _id);
  return toAddress(doc);
}

// Returns false when the address does not exist or belongs to someone else
export async function deleteAddress(userId, id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const removed = await (await addresses()).findOneAndDelete({ _id, userId: toObjectId(userId) });
  if (!removed) return false;
  if (removed.isDefault) {
    const [next] = await listAddresses(userId); // oldest remaining address becomes the default
    if (next) await (await addresses()).updateOne({ _id: toObjectId(next._id) }, { $set: { isDefault: true } });
  }
  return true;
}
