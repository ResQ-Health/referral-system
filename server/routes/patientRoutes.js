import express from 'express';
import { lookupPatient, getPatients } from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/patients/lookup?email=... (Clinician only)
router.get('/lookup', protect, lookupPatient);
router.post('/lookup', protect, lookupPatient);

// GET /api/patients (Clinician only)
router.get('/', protect, getPatients);

export default router;
