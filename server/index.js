import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initFirebaseAdmin } from './config/firebaseAdmin.js';
import { initMailer } from './config/mailer.js';
import authRoutes from './routes/authRoutes.js';
import clinicalRoutes from './routes/clinicalRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import { seedClinicalCatalog } from './config/seedCatalog.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// Enable CORS and JSON body parser
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.status(200).json({
    status: 'online',
    service: 'ResQ Healthcare Authentication & Clinical Server',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatusMap[dbStatus] || 'unknown',
    hasMongoUri: !!process.env.MONGODB_URI,
    timestamp: new Date().toISOString(),
  });
});

// Authentication & Clinical Routes
app.use('/api/auth', authRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/patients', patientRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Bootstrap Database, Cache, and Services (Persistent environments only)
const startServer = async () => {
  console.log('🔄 Initializing ResQ Healthcare Backend Services...');

  // 1. Connect MongoDB & Seed Clinical Catalog
  await connectDB();
  await seedClinicalCatalog();

  // 2. Initialize Redis
  initRedis();

  // 3. Initialize Firebase Admin
  initFirebaseAdmin();

  // 4. Initialize Gmail SMTP Mailer
  initMailer();

  // 5. Start HTTP Server
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 ResQ Healthcare Auth Server Online!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
