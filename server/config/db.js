import mongoose from 'mongoose';

let cachedConnection = null;

export const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables');
    return null;
  }

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✓ MongoDB Connected: ${cachedConnection.connection.host} (${cachedConnection.connection.name})`);
    return cachedConnection;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    return null;
  }
};
