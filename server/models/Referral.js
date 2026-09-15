import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referralId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    doctorEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    doctorName: {
      type: String,
      default: '',
      trim: true,
    },
    doctorSpecialty: {
      type: String,
      default: 'Consultant Specialist',
    },
    doctorPractice: {
      type: String,
      default: 'ResQ Medical Center',
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      default: '',
      trim: true,
    },
    patientGender: {
      type: String,
      default: '',
    },
    patientDob: {
      type: String,
      default: '',
    },
    patientAddress: {
      type: String,
      default: '',
    },
    scanType: {
      type: String,
      required: true,
      trim: true,
    },
    bodyPart: {
      type: String,
      required: true,
      trim: true,
    },
    contrastOption: {
      type: String,
      default: 'Not Specified',
    },
    clinicalNote: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'Emergency'],
      default: 'Routine',
    },
    facilityId: {
      type: String,
      default: '',
    },
    providerId: {
      type: String,
      default: 'CWZDBt9Xmv',
    },
    serviceId: {
      type: String,
      default: 'P7S_Vf3fBt',
    },
    facilityName: {
      type: String,
      default: 'Patient Choice (Open Referral)',
    },
    facilityAddress: {
      type: String,
      default: '',
    },
    facilityPrice: {
      type: Number,
      default: 0,
    },
    slot: {
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      display: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Booking in Progress',
        'Confirmed',
        'Completed',
        'Report Ready',
        'Expired',
        'Paid',
      ],
      default: 'Submitted',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    paymentDetails: {
      method: { type: String, default: '' },
      reference: { type: String, default: '' },
      paidAt: { type: Date },
    },
    referralLink: {
      type: String,
      default: '',
    },
    patientAppointmentId: {
      type: String,
      default: '',
    },
    patientSyncStatus: {
      type: String,
      enum: ['Pending', 'Synced', 'Failed'],
      default: 'Pending',
    },
    patientSyncError: {
      type: String,
      default: '',
    },
    // Clinician-side external API sync fields
    clinicianAppointmentId: {
      type: String,
      default: '',
    },
    clinicianSyncStatus: {
      type: String,
      enum: ['Pending', 'Synced', 'Failed'],
      default: 'Pending',
    },
    clinicianSyncError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Referral = mongoose.model('Referral', referralSchema);
export default Referral;
