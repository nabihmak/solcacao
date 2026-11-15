/**
 * db.js - one shared MongoDB connection for Student 1's data (users, addresses).
 * Uses the same MONGO_CONNECTION_STRING as the rest of the server (backend/.env).
 *
 * Usage:
 *   import { getDb } from '../config/db.js';
 *   const users = (await getDb()).collection('users');
 *
 * The first call connects and makes sure the indexes exist:
 *   users.email      unique, so two accounts can never share an email
 *   addresses.userId fast "addresses of this user" lookups
 */
import { MongoClient } from 'mongodb';

let client;
let dbPromise;

async function connect() {
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) throw new Error('MONGO_CONNECTION_STRING is not set in backend/.env');
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(process.env.MONGO_DB_NAME || 'solcacao');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('addresses').createIndex({ userId: 1 });
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = connect().catch((error) => {
      dbPromise = undefined; // try again on the next request
      throw error;
    });
  }
  return dbPromise;
}

// Closes the connection (used by the seed script so it can exit)
export async function closeDb() {
  if (client) await client.close();
  client = undefined;
  dbPromise = undefined;
}
