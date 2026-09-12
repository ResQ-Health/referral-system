import app from '../server/index.js';
import mongoose from 'mongoose';
import { connectDB } from '../server/config/db.js';
import { initFirebaseAdmin } from '../server/config/firebaseAdmin.js';
import { initMailer } from '../server/config/mailer.js';

let servicesInitialized = false;

export default async function handler(req, res) {
  if (!servicesInitialized) {
    initFirebaseAdmin();
    initMailer();
    servicesInitialized = true;
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('MongoDB connection error in serverless handler:', err.message);
    }
  }

  return app(req, res);
}
