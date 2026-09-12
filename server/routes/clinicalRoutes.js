import express from 'express';
import { ScanType } from '../models/ScanType.js';
import { BodyPart } from '../models/BodyPart.js';
import {
  DEFAULT_SCAN_TYPES,
  DEFAULT_BODY_PARTS,
  DEFAULT_CONTRAST_OPTIONS,
  seedClinicalCatalog,
} from '../config/seedCatalog.js';

const router = express.Router();

/**
 * GET /api/clinical/catalog
 * Returns all active scan types, body parts (67), and contrast options
 */
router.get('/catalog', async (req, res) => {
  try {
    let scanTypes = await ScanType.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    let bodyParts = await BodyPart.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();

    // If DB is empty, auto seed
    if (!scanTypes || scanTypes.length === 0 || !bodyParts || bodyParts.length === 0) {
      await seedClinicalCatalog();
      scanTypes = await ScanType.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
      bodyParts = await BodyPart.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    }

    const scanTypeNames = scanTypes && scanTypes.length > 0
      ? scanTypes.map((s) => s.name)
      : DEFAULT_SCAN_TYPES.map((s) => s.name);

    const bodyPartNames = bodyParts && bodyParts.length > 0
      ? bodyParts.map((b) => b.name)
      : DEFAULT_BODY_PARTS;

    return res.status(200).json({
      success: true,
      scanTypes: scanTypeNames,
      bodyParts: bodyPartNames,
      contrastOptions: DEFAULT_CONTRAST_OPTIONS,
      count: {
        scanTypes: scanTypeNames.length,
        bodyParts: bodyPartNames.length,
      },
    });
  } catch (error) {
    console.error('Error fetching clinical catalog:', error);
    // Graceful fallback to default values
    return res.status(200).json({
      success: true,
      scanTypes: DEFAULT_SCAN_TYPES.map((s) => s.name),
      bodyParts: DEFAULT_BODY_PARTS,
      contrastOptions: DEFAULT_CONTRAST_OPTIONS,
      source: 'fallback',
    });
  }
});

/**
 * GET /api/clinical/scan-types
 */
router.get('/scan-types', async (req, res) => {
  try {
    const scans = await ScanType.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    const list = scans.length > 0 ? scans.map((s) => s.name) : DEFAULT_SCAN_TYPES.map((s) => s.name);
    res.status(200).json({ success: true, scanTypes: list });
  } catch (err) {
    res.status(200).json({ success: true, scanTypes: DEFAULT_SCAN_TYPES.map((s) => s.name) });
  }
});

/**
 * GET /api/clinical/body-parts
 */
router.get('/body-parts', async (req, res) => {
  try {
    const parts = await BodyPart.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    const list = parts.length > 0 ? parts.map((b) => b.name) : DEFAULT_BODY_PARTS;
    res.status(200).json({ success: true, bodyParts: list });
  } catch (err) {
    res.status(200).json({ success: true, bodyParts: DEFAULT_BODY_PARTS });
  }
});

/**
 * GET /api/clinical/contrast-options
 */
router.get('/contrast-options', (req, res) => {
  res.status(200).json({ success: true, contrastOptions: DEFAULT_CONTRAST_OPTIONS });
});

import { protect } from '../middleware/authMiddleware.js';

/**
 * POST /api/clinical/seed
 * Force-reseeds clinical catalog in MongoDB (Admin/Authenticated Clinician)
 */
router.post('/seed', protect, async (req, res) => {
  try {
    const result = await seedClinicalCatalog();
    res.status(200).json({
      success: true,
      message: 'Clinical catalog successfully populated to MongoDB!',
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
