import mongoose from 'mongoose';

import config from './index.js';

/**
 * Open the MongoDB connection.
 *
 * Resolves with the Mongoose connection on success. On failure it logs the
 * failure context and exits the process non-zero (fail fast): the API must
 * never accept traffic without a database connection. The connection string
 * itself is never echoed, so embedded credentials cannot leak into logs.
 *
 * @param {string} [uri=config.mongoUri] MongoDB connection string.
 * @returns {Promise<typeof mongoose>} The Mongoose instance.
 */
export async function connectDB(uri = config.mongoUri) {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

export default connectDB;
