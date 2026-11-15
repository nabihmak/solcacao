/**
 * userStore.js - every database query for users and addresses (Student 1).
 * Uses the Mongoose models in models/User.js and models/Address.js and the shared
 * connection from config/mongoose.js. The routes only call these functions, so the
 * tests can swap in a fake store and run without a database.
 *
 * Objects leave this file in the shape the front end already uses: _id as a string,
 * dates as ISO text, and never the password hash.
 */
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Address } from '../models/Address.js';

// An id from a URL or a token that is not a valid MongoDB id simply matches nothing
const isValidId = (id) => mongoose.isValidObjectId(String(id));

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
  if (!isValidId(id)) return null;
  const doc = await User.findById(id).lean();
  return doc ? toUser(doc) : null;
}

// Also returns the password hash, for the login check only
export async function findUserByEmail(email) {
  const doc = await User.findOne({ email }).select('+passwordHash').lean();
  return doc ? { user: toUser(doc), passwordHash: doc.passwordHash } : null;
}

export async function emailExists(email) {
  return Boolean(await User.exists({ email }));
}

// Throws an error with code 'EMAIL_TAKEN' if the email was registered at the same moment
export async function createUser({ name, email, passwordHash, accountType, phone, preferredLanguage, company }) {
  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
      accountType,
      phone,
      preferredLanguage,
      corporatePartner: accountType === 'B2B' ? company : null,
    });
    return toUser(user);
  } catch (error) {
    if (error.code === 11000) error.code = 'EMAIL_TAKEN'; // unique index on email
    throw error;
  }
}

// changes: { name?, phone?, preferredLanguage?, company? } (already validated)
export async function updateUser(id, changes) {
  const set = {};
  ['name', 'phone', 'preferredLanguage'].forEach((field) => {
    if (changes[field] !== undefined) set[field] = changes[field];
  });
  if (changes.company) {
    Object.entries(changes.company).forEach(([field, value]) => {
      if (value !== undefined) set[`corporatePartner.${field}`] = value;
    });
  }
  const doc = await User.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after', runValidators: true }).lean();
  return doc ? toUser(doc) : null;
}

export async function getPasswordHash(id) {
  const doc = await User.findById(id).select('+passwordHash').lean();
  return doc?.passwordHash ?? null;
}

export async function setPasswordHash(id, passwordHash) {
  await User.updateOne({ _id: id }, { $set: { passwordHash } });
}

/* -------------------------- Addresses -------------------------- */

// Default address first, then oldest first
export async function listAddresses(userId) {
  const docs = await Address.find({ userId }).sort({ isDefault: -1, createdAt: 1, _id: 1 }).lean();
  return docs.map(toAddress);
}

// Only one default address per user
async function keepOneDefault(userId, defaultId) {
  await Address.updateMany({ userId, _id: { $ne: defaultId } }, { $set: { isDefault: false } });
}

export async function addAddress(userId, values) {
  const isFirst = !(await Address.exists({ userId }));
  const address = await Address.create({
    userId,
    label: values.label,
    street: values.street,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
    isDefault: isFirst || Boolean(values.isDefault), // the first address becomes the default
  });
  if (address.isDefault) await keepOneDefault(userId, address._id);
  return toAddress(address);
}

// Returns null when the address does not exist or belongs to someone else
export async function updateAddress(userId, id, values) {
  if (!isValidId(id)) return null;
  const set = {};
  ['label', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault'].forEach((field) => {
    if (values[field] !== undefined) set[field] = values[field];
  });
  const doc = await Address.findOneAndUpdate(
    { _id: id, userId },
    { $set: set },
    { returnDocument: 'after', runValidators: true }
  ).lean();
  if (!doc) return null;
  if (doc.isDefault) await keepOneDefault(userId, doc._id);
  return toAddress(doc);
}

// Returns false when the address does not exist or belongs to someone else
export async function deleteAddress(userId, id) {
  if (!isValidId(id)) return false;
  const removed = await Address.findOneAndDelete({ _id: id, userId }).lean();
  if (!removed) return false;
  if (removed.isDefault) {
    const [next] = await listAddresses(userId); // oldest remaining address becomes the default
    if (next) await Address.updateOne({ _id: next._id }, { $set: { isDefault: true } });
  }
  return true;
}
