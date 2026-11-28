const mongoose = require('mongoose');

// Local server uses process.env.MONGO_URI.
// Cloudflare Worker passes its secret explicitly: connectDB(env.MONGO_URI, { exitOnError: false }).
const connectDB = async (uri = process.env.MONGO_URI, { exitOnError = true } = {}) => {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Check server/.env or the Cloudflare secret.');
  }

  try {
    const connection = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (exitOnError) process.exit(1);
    throw error;
  }
};

module.exports = connectDB;
