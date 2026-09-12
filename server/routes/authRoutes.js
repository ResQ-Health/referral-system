import express from 'express';
import {
  register,
  verifyCode,
  resendCode,
  login,
  googleAuth,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
