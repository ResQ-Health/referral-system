import express from 'express';
import {
  createReferral,
  getReferrals,
  getReferralById,
  payReferral,
} from '../controllers/referralController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Clinician authenticated endpoints
router.post('/', protect, createReferral);
router.get('/', protect, getReferrals);

// Patient / Public direct referral checkout endpoints
router.get('/:id', getReferralById);
router.post('/:id/pay', payReferral);

export default router;
