import express from 'express';
import { Referral } from '../models/Referral.js';
import { bookClinicianAppointment, getClinicianAppointments } from '../services/patientSyncService.js';

const router = express.Router();

const PATIENT_API_BASE_URL = (process.env.PATIENT_API_BASE_URL || 'https://server-16pz.onrender.com').replace(/\/+$/, '');

/**
 * Helper to ensure a future date YYYY-MM-DD
 */
const getFutureDate = (rawDate) => {
  const getFallback = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  if (!rawDate) return getFallback();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const today = new Date().toISOString().split('T')[0];
    if (rawDate > today) return rawDate;
    return getFallback();
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed > today) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return getFallback();
};

/**
 * 1. POST /api/v1/appointments/clinician/book
 * (and alias POST /api/v1/appointments/clinician-book)
 * Book as a referral clinician
 */
export const handleClinicianBookAppointment = async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      date,
      start_time,
      end_time,
      patientEmail,
      patientId,
      patientName,
      patientPhone,
      notes,
      formData,
      referralId,
    } = req.body;

    const clinicianAuthToken = req.headers['authorization'] || req.headers['Authorization'] || '';

    const effectiveDate = getFutureDate(date);
    const effectiveStartTime = start_time || '10:00 AM';
    const effectiveEndTime = end_time || '11:00 AM';
    const effectiveProviderId = providerId || 'CWZDBt9Xmv';
    const effectiveServiceId = serviceId || 'P7S_Vf3fBt';
    const effectiveEmail = (patientEmail || req.user?.email || '').toLowerCase().trim();

    const bookingPayload = {
      providerId: effectiveProviderId,
      serviceId: effectiveServiceId,
      date: effectiveDate,
      start_time: effectiveStartTime,
      end_time: effectiveEndTime,
      ...(patientId ? { patientId } : {}),
      patientEmail: effectiveEmail,
      patientName: patientName || '',
      patientPhone: patientPhone || '',
      notes: notes || 'Referral checkup for patient',
      formData: {
        patientEmail: effectiveEmail,
        clinicianEmail: req.user?.email || '',
        ...(formData && typeof formData === 'object' ? formData : {}),
      },
    };

    console.log('📡 [AppointmentsProxy] Forwarding clinician booking to server-16:', JSON.stringify(bookingPayload));

    const response = await fetch(`${PATIENT_API_BASE_URL}/api/v1/appointments/clinician/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(clinicianAuthToken ? { 'Authorization': clinicianAuthToken } : {}),
      },
      body: JSON.stringify(bookingPayload),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      const apptId =
        data.data?.appointment?._id ||
        data.data?.appointment?.id ||
        data.data?.id ||
        data.appointment?.id ||
        `CLINICIAN-APT-${Date.now()}`;

      // Update any pending referral in our database to Completed and attach appointment_id
      try {
        const query = referralId
          ? { referralId }
          : { patientEmail: effectiveEmail, status: 'Booking in Progress' };

        const matchedReferral = await Referral.findOneAndUpdate(
          query,
          {
            status: 'Completed',
            clinicianAppointmentId: String(apptId),
            clinicianSyncStatus: 'Synced',
            providerId: effectiveProviderId,
            serviceId: effectiveServiceId,
          },
          { new: true, sort: { createdAt: -1 } }
        );

        if (matchedReferral) {
          console.log(`✅ [AppointmentsProxy] Updated referral ${matchedReferral.referralId} to Completed with appointment ${apptId}`);
        }
      } catch (dbErr) {
        console.warn('Could not update matching referral in DB:', dbErr.message);
      }

      return res.status(200).json(data);
    } else {
      return res.status(response.status || 400).json(
        data || {
          success: false,
          message: `Failed to book appointment: HTTP ${response.status}`,
        }
      );
    }
  } catch (error) {
    console.error('Clinician appointment booking proxy error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal error booking appointment',
    });
  }
};

/**
 * 2. GET /api/v1/appointments/clinician
 * View the appointment list on the clinician side
 */
export const handleGetClinicianAppointments = async (req, res) => {
  try {
    const clinicianAuthToken = req.headers['authorization'] || req.headers['Authorization'] || '';

    const response = await fetch(`${PATIENT_API_BASE_URL}/api/v1/appointments/clinician`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(clinicianAuthToken ? { 'Authorization': clinicianAuthToken } : {}),
      },
    });

    const data = await response.json().catch(() => null);

    return res.status(response.status).json(
      data || {
        success: false,
        appointments: [],
        message: 'No response from server',
      }
    );
  } catch (error) {
    console.error('Get clinician appointments error:', error);
    return res.status(500).json({
      success: false,
      appointments: [],
      message: error.message || 'Failed to fetch appointments',
    });
  }
};

/**
 * 3. GET /api/v1/appointments/patient
 * View the appointment list on the patient side
 */
export const handleGetPatientAppointments = async (req, res) => {
  try {
    const patientAuthToken = req.headers['authorization'] || req.headers['Authorization'] || '';

    const response = await fetch(`${PATIENT_API_BASE_URL}/api/v1/appointments/patient`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(patientAuthToken ? { 'Authorization': patientAuthToken } : {}),
      },
    });

    const data = await response.json().catch(() => null);

    return res.status(response.status).json(
      data || {
        success: false,
        appointments: [],
        message: 'No response from server',
      }
    );
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.status(500).json({
      success: false,
      appointments: [],
      message: error.message || 'Failed to fetch appointments',
    });
  }
};

// Route definitions
router.post('/clinician/book', handleClinicianBookAppointment);
router.post('/clinician-book', handleClinicianBookAppointment);
router.get('/clinician', handleGetClinicianAppointments);
router.get('/patient', handleGetPatientAppointments);

export default router;
