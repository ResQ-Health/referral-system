import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'resq-secret-key-default';
    
    // First attempt custom JWT verification
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = await User.findOne({ email: decoded.email }).select('-password');
      if (req.user) {
        if (req.user.user_type && req.user.user_type !== 'Clinician') {
          return res.status(403).json({
            success: false,
            message: `Access denied. This portal is exclusively for Clinicians.`,
          });
        }
        return next();
      }
    } catch (_) {}

    // Fallback: Check if token is Firebase ID Token
    const admin = getFirebaseAdmin();
    if (admin && admin.apps?.length > 0) {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      req.user = await User.findOne({ email: decodedFirebase.email }).select('-password');
      if (req.user && req.user.user_type && req.user.user_type !== 'Clinician') {
        return res.status(403).json({
          success: false,
          message: `Access denied. This portal is exclusively for Clinicians.`,
        });
      }
      if (!req.user) {
        req.user = {
          email: decodedFirebase.email,
          fullname: decodedFirebase.name || '',
          user_type: 'Clinician',
          isVerified: true,
        };
      }
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
};
