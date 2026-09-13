import { Referral } from '../models/Referral.js';
import { sendPatientReferralEmail } from '../config/mailer.js';
import { syncReferralToPatientApp, confirmPatientAppBooking } from '../services/patientSyncService.js';

// Helper: Generate unique referral ID: REF-YYYYMMDD-XXXXX
const generateReferralId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `REF-${y}${m}${d}-${rand}`;
};

/**
 * 1. Create Referral
 * POST /api/referrals
 */
export const createReferral = async (req, res) => {
  try {
    const {
      doctorEmail,
      doctorName,
      doctorSpecialty,
      doctorPractice,
      patientName,
      patientEmail,
      patientPhone,
      patientGender,
      patientDob,
      patientAddress,
      scanType,
      bodyPart,
      contrastOption,
      clinicalNote,
      priority,
      facilityId,
      facilityName,
      facilityAddress,
      facilityPrice,
      slot,
      status,
    } = req.body;

    if (!patientName || !scanType || !bodyPart) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, scan type, and body part are required',
      });
    }

    const referralId = req.body.referralId || generateReferralId();
    const effectiveDoctorEmail = (doctorEmail || req.user?.email || 'doctor@resqhealth.com').toLowerCase().trim();
    const effectivePatientEmail = (patientEmail || '').toLowerCase().trim();

    // Determine frontend base URL
    const origin = req.headers.origin || 'http://localhost:5173';
    const referralLink = `${origin}/patient/referral/${referralId}`;

    const newReferral = new Referral({
      referralId,
      doctorEmail: effectiveDoctorEmail,
      doctorName: doctorName || req.user?.fullname || 'Dr. Specialist',
      doctorSpecialty: doctorSpecialty || req.user?.specialty || 'Consultant Specialist',
      doctorPractice: doctorPractice || req.user?.practiceName || 'ResQ Medical Center',
      patientName: patientName.trim(),
      patientEmail: effectivePatientEmail,
      patientPhone: patientPhone || '',
      patientGender: patientGender || '',
      patientDob: patientDob || '',
      patientAddress: patientAddress || '',
      scanType,
      bodyPart,
      contrastOption: contrastOption || 'Not Specified',
      clinicalNote: clinicalNote || '',
      priority: priority || 'Routine',
      facilityId: facilityId || '',
      facilityName: facilityName || 'Patient Choice (Open Referral)',
      facilityAddress: facilityAddress || '',
      facilityPrice: Number(facilityPrice) || 0,
      slot: slot || { date: '', time: '', display: '' },
      status: status || (facilityName && facilityName !== 'Patient Choice (Open Referral)' ? 'Booking in Progress' : 'Submitted'),
      paymentStatus: 'Pending',
      referralLink,
    });

    const saved = await newReferral.save();

    // Sync booking with Patient Client API (server-16pz.onrender.com)
    try {
      const syncResult = await syncReferralToPatientApp(saved);
      saved.patientSyncStatus = syncResult.patientSyncStatus;
      if (syncResult.patientAppointmentId) {
        saved.patientAppointmentId = syncResult.patientAppointmentId;
      }
      if (syncResult.error) {
        saved.patientSyncError = syncResult.error;
      }
      await saved.save();
    } catch (syncErr) {
      console.warn('Patient API sync warning:', syncErr.message);
      saved.patientSyncStatus = 'Failed';
      saved.patientSyncError = syncErr.message;
      await saved.save().catch(() => null);
    }

    // If patient email is provided, send notification email
    if (effectivePatientEmail) {
      try {
        await sendPatientReferralEmail({
          toEmail: effectivePatientEmail,
          patientName: saved.patientName,
          doctorName: saved.doctorName,
          doctorSpecialty: saved.doctorSpecialty,
          doctorPractice: saved.doctorPractice,
          referralId: saved.referralId,
          scanType: saved.scanType,
          bodyPart: saved.bodyPart,
          contrastOption: saved.contrastOption,
          facilityName: saved.facilityName,
          slotDisplay: saved.slot?.display || '',
          price: saved.facilityPrice,
          referralLink: saved.referralLink,
        });
      } catch (mailErr) {
        console.warn('Error sending referral email to patient:', mailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Referral created and patient notification dispatched successfully',
      referral: saved,
    });
  } catch (error) {
    console.error('Create referral error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create referral',
    });
  }
};

/**
 * 2. Get Referrals (by doctor or all)
 * GET /api/referrals
 */
export const getReferrals = async (req, res) => {
  try {
    const { doctorEmail, patientEmail, search } = req.query;
    const filter = {};

    if (doctorEmail) {
      filter.doctorEmail = doctorEmail.toLowerCase().trim();
    }
    if (patientEmail) {
      filter.patientEmail = patientEmail.toLowerCase().trim();
    }
    if (search) {
      const q = search.trim();
      filter.$or = [
        { referralId: { $regex: q, $options: 'i' } },
        { patientName: { $regex: q, $options: 'i' } },
        { scanType: { $regex: q, $options: 'i' } },
        { bodyPart: { $regex: q, $options: 'i' } },
      ];
    }

    const referrals = await Referral.find(filter).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: referrals.length,
      referrals,
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch referrals',
    });
  }
};

/**
 * 3. Get Single Referral by ID (for patient or doctor)
 * GET /api/referrals/:id
 */
export const getReferralById = async (req, res) => {
  try {
    const { id } = req.params;
    const referral = await Referral.findOne({
      $or: [{ referralId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: `Referral ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      referral,
    });
  } catch (error) {
    console.error('Get referral by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch referral',
    });
  }
};

/**
 * 4. Pay / Confirm Referral
 * POST /api/referrals/:id/pay
 */
export const payReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, reference } = req.body;

    const referral = await Referral.findOne({
      $or: [{ referralId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: `Referral ${id} not found`,
      });
    }

    referral.status = 'Confirmed';
    referral.paymentStatus = 'Paid';
    referral.paymentDetails = {
      method: paymentMethod || 'Card Payment',
      reference: reference || `PAY-${Date.now()}`,
      paidAt: new Date(),
    };

    await referral.save();

    // Confirm booking on Patient Client API
    try {
      await confirmPatientAppBooking(referral, { paymentMethod, reference });
    } catch (confirmErr) {
      console.warn('Patient API booking confirmation warning:', confirmErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment completed successfully and booking confirmed!',
      referral,
    });
  } catch (error) {
    console.error('Pay referral error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete payment',
    });
  }
};
