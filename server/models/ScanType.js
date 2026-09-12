import mongoose from 'mongoose';

const scanTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    modality: {
      type: String,
      trim: true,
      default: '',
    },
    requiresContrast: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const ScanType = mongoose.models.ScanType || mongoose.model('ScanType', scanTypeSchema);
