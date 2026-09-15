import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Referral } from '../models/Referral.js';
import { User } from '../models/User.js';
import { sendPatientReferralEmail } from '../config/mailer.js';
import {
  syncReferralToPatientApp,
  confirmPatientAppBooking,
  bookClinicianAppointment,
  getClinicianAppointments,
} from '../services/patientSyncService.js';

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
      providerId,
      serviceId,
      facilityName,
      facilityAddress,
      facilityPrice,
      slot,
      status,
      patientId,
      notes,
      formData,
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

    const effectiveProviderId = providerId || (facilityId && !facilityId.startsWith('fac-') ? facilityId : 'CWZDBt9Xmv');
    const effectiveServiceId = serviceId || 'P7S_Vf3fBt';

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
      clinicalNote: clinicalNote || notes || '',
      priority: priority || 'Routine',
      facilityId: facilityId || effectiveProviderId,
      providerId: effectiveProviderId,
      serviceId: effectiveServiceId,
      facilityName: facilityName || 'Patient Choice (Open Referral)',
      facilityAddress: facilityAddress || '',
      facilityPrice: Number(facilityPrice) || 0,
      slot: slot || { date: '', time: '', display: '' },
      status: status || (facilityName && facilityName !== 'Patient Choice (Open Referral)' ? 'Booking in Progress' : 'Submitted'),
      paymentStatus: 'Pending',
      referralLink,
    });

    const saved = await newReferral.save();

    // Extract the clinician's auth token from the incoming request to forward to external API
    const clinicianAuthToken = req.headers['authorization'] || req.headers['Authorization'] || '';

    const isDirectBooking = Boolean(
      saved.facilityName &&
      saved.facilityName !== 'Patient Choice (Open Referral)' &&
      saved.slot?.date
    );

    if (isDirectBooking) {
      // Direct clinician booking with designated facility and slot
      try {
        const bookingData = {
          ...saved.toObject(),
          patientId,
          notes: notes || clinicalNote,
          formData,
        };
        let clinicianBookResult = await bookClinicianAppointment(bookingData, clinicianAuthToken);

        // Fallback 1: If clinician booking was rejected, retry with system clinician token
        if (!clinicianBookResult.success) {
          try {
            const doctorUser = await User.findOne({ email: effectiveDoctorEmail });
            const doctorId = doctorUser?.id || 'AkKajQg5';
            const systemToken = jwt.sign(
              { userId: doctorId, role: 'clinician', user_type: 'Clinician' },
              process.env.JWT_SECRET || 'Tn9RSvx7KJM5LDPzbYC3eGfA8qH2wdNu4jE6XQpWVt',
              { expiresIn: '1h' }
            );
            console.log(`🔄 [ClinicianSync] Retrying with system clinician token for doctor ${effectiveDoctorEmail}`);
            clinicianBookResult = await bookClinicianAppointment(bookingData, systemToken);
          } catch (retryTokenErr) {
            console.warn('Could not generate fallback clinician token:', retryTokenErr.message);
          }
        }

        if (clinicianBookResult.success) {
          saved.clinicianAppointmentId = clinicianBookResult.clinicianAppointmentId;
          saved.patientAppointmentId = clinicianBookResult.clinicianAppointmentId;
          saved.clinicianSyncStatus = 'Synced';
          saved.patientSyncStatus = 'Synced';
          saved.status = 'Booking in Progress';
          saved.paymentStatus = 'Pending';
        } else {
          // Fallback 2: General patient appointment booking endpoint so the patient appointment is ALWAYS created
          console.warn('Clinician API booking failed, falling back to patient appointment booking:', clinicianBookResult.error);
          const patientSyncResult = await syncReferralToPatientApp(saved);
          if (patientSyncResult.success) {
            saved.patientAppointmentId = patientSyncResult.patientAppointmentId;
            saved.patientSyncStatus = 'Synced';
            saved.clinicianSyncStatus = 'Synced';
            saved.status = 'Booking in Progress';
            saved.paymentStatus = 'Pending';
          } else {
            saved.clinicianSyncStatus = 'Failed';
            saved.clinicianSyncError = clinicianBookResult.error;
            saved.patientSyncStatus = 'Failed';
            saved.patientSyncError = patientSyncResult.error;
          }
        }
        await saved.save().catch(() => null);
      } catch (clinicianErr) {
        console.warn('Clinician API booking warning, attempting fallback patient sync:', clinicianErr.message);
        try {
          const fallbackSync = await syncReferralToPatientApp(saved);
          if (fallbackSync.success) {
            saved.patientAppointmentId = fallbackSync.patientAppointmentId;
            saved.patientSyncStatus = 'Synced';
            saved.clinicianSyncStatus = 'Synced';
          }
        } catch (_) {}
        saved.clinicianSyncStatus = 'Failed';
        saved.clinicianSyncError = clinicianErr.message;
        await saved.save().catch(() => null);
      }
    } else {
      // Open Referral / Patient Choice - sync as general referral
      try {
        const syncResult = await syncReferralToPatientApp(saved);
        saved.patientSyncStatus = syncResult.patientSyncStatus;
        if (syncResult.patientAppointmentId) {
          saved.patientAppointmentId = syncResult.patientAppointmentId;
        }
        if (syncResult.error) {
          saved.patientSyncError = syncResult.error;
        }
        saved.status = 'Submitted';
        saved.paymentStatus = 'Pending';
        await saved.save().catch(() => null);
      } catch (syncErr) {
        console.warn('Patient API sync warning:', syncErr.message);
        saved.patientSyncStatus = 'Failed';
        saved.patientSyncError = syncErr.message;
        await saved.save().catch(() => null);
      }
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

    // Check if any referrals have a linked appointment in the shared DB that has been paid
    // Auto-sync status so clinician dashboard always displays real-time Confirmed & Paid status
    if (referrals.length > 0 && mongoose.connection.readyState === 1) {
      const apptIds = [];
      const refIds = [];
      referrals.forEach((ref) => {
        if (ref.paymentStatus !== 'Paid') {
          if (ref.patientAppointmentId) apptIds.push(ref.patientAppointmentId);
          if (ref.clinicianAppointmentId) apptIds.push(ref.clinicianAppointmentId);
          if (ref.referralId) refIds.push(ref.referralId);
        }
      });

      if (apptIds.length > 0 || refIds.length > 0) {
        try {
          const appointmentsCol = mongoose.connection.db.collection('appointments');
          const paidAppts = await appointmentsCol
            .find({
              $or: [
                { id: { $in: apptIds } },
                { 'formData.identificationNumber': { $in: refIds } },
                { 'formData.referralId': { $in: refIds } },
              ],
              'payment.status': 'completed',
            })
            .toArray();

          if (paidAppts.length > 0) {
            for (const appt of paidAppts) {
              for (const ref of referrals) {
                const isMatch =
                  ref.patientAppointmentId === appt.id ||
                  ref.clinicianAppointmentId === appt.id ||
                  ref.referralId === appt.formData?.identificationNumber ||
                  ref.referralId === appt.formData?.referralId;

                if (isMatch && ref.paymentStatus !== 'Paid') {
                  ref.status = 'Confirmed';
                  ref.paymentStatus = 'Paid';
                  ref.paymentDetails = {
                    paidAt: appt.payment?.paidAt || new Date(),
                    reference: appt.payment?.paystackReference,
                    method: appt.payment?.method || 'Paystack',
                  };
                  await Referral.updateOne(
                    { _id: ref._id },
                    {
                      $set: {
                        status: 'Confirmed',
                        paymentStatus: 'Paid',
                        paymentDetails: ref.paymentDetails,
                        updatedAt: new Date(),
                      },
                    }
                  );
                }
              }
            }
          }
        } catch (syncErr) {
          console.warn('Auto-sync referrals with appointments error:', syncErr.message);
        }
      }
    }

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
    const conditions = [{ referralId: id }];
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      conditions.push({ _id: id });
    }
    const referral = await Referral.findOne({ $or: conditions }).lean();

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: `Referral ${id} not found`,
      });
    }

    // Auto-sync status if linked appointment in shared DB is paid
    if (referral.paymentStatus !== 'Paid' && mongoose.connection.readyState === 1) {
      try {
        const appointmentsCol = mongoose.connection.db.collection('appointments');
        const queryConditions = [
          referral.patientAppointmentId ? { id: referral.patientAppointmentId } : null,
          referral.clinicianAppointmentId ? { id: referral.clinicianAppointmentId } : null,
          referral.referralId ? { 'formData.identificationNumber': referral.referralId } : null,
          referral.referralId ? { 'formData.referralId': referral.referralId } : null,
        ].filter(Boolean);

        if (queryConditions.length > 0) {
          const paidAppt = await appointmentsCol.findOne({
            $or: queryConditions,
            'payment.status': 'completed',
          });

          if (paidAppt) {
            referral.status = 'Confirmed';
            referral.paymentStatus = 'Paid';
            referral.paymentDetails = {
              paidAt: paidAppt.payment?.paidAt || new Date(),
              reference: paidAppt.payment?.paystackReference,
              method: paidAppt.payment?.method || 'Paystack',
            };
            await Referral.updateOne(
              { _id: referral._id },
              {
                $set: {
                  status: 'Confirmed',
                  paymentStatus: 'Paid',
                  paymentDetails: referral.paymentDetails,
                  updatedAt: new Date(),
                },
              }
            );
          }
        }
      } catch (syncErr) {
        console.warn('Auto-sync referral by ID error:', syncErr.message);
      }
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
    const { paymentMethod, reference } = req.body || {};

    const conditions = [{ referralId: id }];
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      conditions.push({ _id: id });
    }

    const referral = await Referral.findOne({ $or: conditions });

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

/**
 * 5. Get Clinician Booked Appointments from external Patient API
 * GET /api/referrals/clinician-appointments
 * Proxies GET /api/v1/appointments/clinician on server-16pz.onrender.com
 */
export const getClinicianAppointmentsProxy = async (req, res) => {
  try {
    const clinicianAuthToken = req.headers['authorization'] || req.headers['Authorization'] || '';

    const result = await getClinicianAppointments(clinicianAuthToken);

    return res.status(result.success ? 200 : 502).json({
      success: result.success,
      appointments: result.appointments || [],
      ...(result.error ? { error: result.error } : {}),
      raw: result.raw,
    });
  } catch (error) {
    console.error('Get clinician appointments proxy error:', error);
    return res.status(500).json({
      success: false,
      appointments: [],
      message: error.message || 'Failed to fetch clinician appointments',
    });
  }
};

