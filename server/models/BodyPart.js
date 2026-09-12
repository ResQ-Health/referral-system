import mongoose from 'mongoose';

const bodyPartSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
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

export const BodyPart = mongoose.models.BodyPart || mongoose.model('BodyPart', bodyPartSchema);
