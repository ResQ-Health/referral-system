import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      sparse: true,
      default: () => Math.random().toString(36).substring(2, 10),
    },
    user_type: {
      type: String,
      enum: ['Clinician', 'DiagnosticProvider', 'Patient'],
      default: 'Clinician',
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
    },
    full_name: {
      type: String,
      default: '',
      trim: true,
    },
    fullname: {
      type: String,
      default: '',
      trim: true,
    },
    phone_number: {
      type: String,
      default: '',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    license_number: {
      type: String,
      default: '',
      trim: true,
    },
    licenseNumber: {
      type: String,
      default: '',
      trim: true,
    },
    specialty: {
      type: String,
      default: 'General Practitioner',
    },
    practice_name: {
      type: String,
      default: '',
      trim: true,
    },
    practiceName: {
      type: String,
      default: '',
      trim: true,
    },
    practice_address: {
      type: String,
      default: '',
      trim: true,
    },
    practiceAddress: {
      type: String,
      default: '',
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String,
      default: '',
    },
    profile_picture: {
      url: { type: String, default: '' },
    },
    personal_details: {
      first_name: { type: String, default: '' },
      last_name: { type: String, default: '' },
      date_of_birth: { type: String, default: '' },
      gender: { type: String, default: '' },
    },
    contact_details: {
      email_address: { type: String, default: '' },
      phone_number: { type: String, default: '' },
    },
    location_details: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
