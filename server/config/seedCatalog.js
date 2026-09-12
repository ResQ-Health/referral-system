import { ScanType } from '../models/ScanType.js';
import { BodyPart } from '../models/BodyPart.js';

export const DEFAULT_SCAN_TYPES = [
  { name: 'CT Scan (Computed Tomography)', code: 'CT', modality: 'Computed Tomography', order: 1 },
  { name: 'MRI Scan (Magnetic Resonance Imaging)', code: 'MRI', modality: 'Magnetic Resonance Imaging', order: 2 },
  { name: 'Ultrasound (US)', code: 'US', modality: 'Ultrasound', order: 3 },
  { name: 'X-Ray', code: 'XR', modality: 'Radiography', order: 4 },
  { name: 'Mammography', code: 'MG', modality: 'Mammography', order: 5 },
  { name: 'Fluoroscopy', code: 'FL', modality: 'Fluoroscopy', order: 6 },
  { name: 'Nuclear Medicine', code: 'NM', modality: 'Nuclear Medicine', order: 7 },
  { name: 'PET/CT Scan', code: 'PET-CT', modality: 'Positron Emission Tomography', order: 8 },
];

export const DEFAULT_CONTRAST_OPTIONS = [
  'With Contrast',
  'Without Contrast',
  'Not Specified',
];

export const DEFAULT_BODY_PARTS = [
  'Abdomen',
  'Abdomen & Pelvis',
  'Abdominal Wall',
  'Aorta',
  'Ankle',
  'Arm / Upper Extremity',
  'Axilla',
  'Brain',
  'Breast',
  'Chest',
  'Clavicle',
  'Coccyx / Sacrum',
  'Colon',
  'Coronary Arteries',
  'Elbow',
  'Esophagus',
  'Eye',
  'Face',
  'Facial Bones',
  'Femur',
  'Fingers',
  'Foot',
  'Forearm',
  'Gallbladder / Hepatobiliary System',
  'Hand',
  'Head',
  'Heel / Calcaneus',
  'Hip',
  'Humerus',
  'Inguinal Canal',
  'Jaw / Mandible',
  'Kidney',
  'Knee',
  'Liver',
  'Liver & Spleen',
  'Lower Extremity / Leg',
  'Lumbar Plexus',
  'Lumbar Spine',
  'Mastoids',
  'Neck',
  'Neck Soft Tissue',
  'Nasal Bones',
  'Orbit / Skull',
  'Parathyroid',
  'Pelvis',
  'Ribs',
  'Renal System',
  'Sacroiliac Joints',
  'Scapula',
  'Shoulder',
  'Sinuses',
  'Skull',
  'Small Bowel',
  'Soft Tissue',
  'Spine',
  'Sternum',
  'Sternoclavicular Joint',
  'Stomach / Upper GI Tract',
  'Testicles',
  'Temporomandibular Joint (TMJ)',
  'Thoracic Spine',
  'Thyroid',
  'Tibia / Fibula',
  'Toes',
  'Urological System',
  'Whole Body',
  'Wrist',
];

export const seedClinicalCatalog = async () => {
  try {
    console.log('🔄 Checking clinical catalog in MongoDB...');

    // 1. Seed Scan Types (Bulk upsert without duplicates)
    const scanOps = DEFAULT_SCAN_TYPES.map((scan) => ({
      updateOne: {
        filter: { name: scan.name },
        update: {
          $set: {
            name: scan.name,
            code: scan.code,
            modality: scan.modality,
            order: scan.order,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));
    await ScanType.bulkWrite(scanOps);

    // Clean up any old duplicate aliases
    const validScanNames = DEFAULT_SCAN_TYPES.map((s) => s.name);
    const deleteOldScans = await ScanType.deleteMany({ name: { $nin: validScanNames } });
    if (deleteOldScans.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deleteOldScans.deletedCount} legacy scan type duplicates`);
    }

    // 2. Seed 67 Body Parts (Bulk upsert without duplicates)
    const bodyOps = DEFAULT_BODY_PARTS.map((partName, idx) => ({
      updateOne: {
        filter: { name: partName },
        update: {
          $set: {
            name: partName,
            order: idx + 1,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));
    await BodyPart.bulkWrite(bodyOps);

    // Clean up any body parts not in the official 67 list
    const deleteOldParts = await BodyPart.deleteMany({ name: { $nin: DEFAULT_BODY_PARTS } });
    if (deleteOldParts.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deleteOldParts.deletedCount} legacy body part duplicates`);
    }

    const scanCount = await ScanType.countDocuments();
    const bodyPartCount = await BodyPart.countDocuments();
    console.log(`✓ Clinical catalog ready in MongoDB: ${scanCount} scan types, ${bodyPartCount} body parts`);
    return { scanCount, bodyPartCount };
  } catch (error) {
    console.error(`✗ Error seeding clinical catalog:`, error.message);
    return null;
  }
};
