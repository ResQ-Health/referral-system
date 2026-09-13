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
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.warn(`ℹ️ MongoDB SRV DNS Notice: Unable to resolve ${uri.split('@')[1] || 'cluster'} over local SRV DNS query. Verify network internet access or use standard connection string format.`);
    } else {
      console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
    }
    return null;
  }
};
