/**
 * mongoose.js - Mongoose connection for the catalog and cart (Student 3).
 * Uses the same MONGO_CONNECTION_STRING and database as the rest of the backend
 * Student 1's User and Address models use this same connection.
 */
import mongoose from 'mongoose';

export async function connectMongoose(uri = process.env.MONGO_CONNECTION_STRING) {
  if (!uri) throw new Error('MONGO_CONNECTION_STRING is missing in backend/.env');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || 'solcacao',
    serverSelectionTimeoutMS: 5000,
  });
  console.log('Mongoose connected (catalog and cart)');
  return mongoose.connection;
}

export async function disconnectMongoose() {
  await mongoose.disconnect();
}
