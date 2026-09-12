import app from '../server/index.js';
import { connectDB } from '../server/config/db.js';
import { initFirebaseAdmin } from '../server/config/firebaseAdmin.js';
import { initMailer } from '../server/config/mailer.js';

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    try {
      await connectDB();
      initFirebaseAdmin();
      initMailer();
      isInitialized = true;
    } catch (err) {
      console.error('Serverless initialization error:', err);
    }
  } else {
    await connectDB();
  }

  return app(req, res);
}
