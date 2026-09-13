import dotenv from 'dotenv';
dotenv.config();

const PATIENT_API_BASE_URL = (process.env.PATIENT_API_BASE_URL || 'https://server-16pz.onrender.com').replace(/\/+$/, '');

/**
 * Format raw date string into YYYY-MM-DD format if possible
 */
const formatBookingDate = (rawDate) => {
  if (!rawDate) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Fallback to today
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate end time given a start time string (e.g. "10:10 am" -> "10:40 AM")
 */
const calculateEndTime = (startTimeStr) => {
  if (!startTimeStr) return '09:30 AM';
  try {
    const match = startTimeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!match) return startTimeStr;

    let hours = parseInt(match[1], 10);
    let minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : '';

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    minutes += 30;
    if (minutes >= 60) {
      minutes -= 60;
      hours = (hours + 1) % 24;
    }

    const endPeriod = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    const displayMins = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMins} ${endPeriod}`;
  } catch (e) {
    return startTimeStr;
  }
};

/**
 * Build the BookAppointmentRequest payload following Resq-client spec
 */
export const buildPatientBookingPayload = (referral) => {
  const date = formatBookingDate(referral.slot?.date);
  const startTime = referral.slot?.time || '09:00 AM';
  const endTime = calculateEndTime(startTime);

  return {
    providerId: referral.facilityId || 'referral-facility',
    serviceId: referral.scanType || 'referral-service',
    date,
    start_time: startTime,
    end_time: endTime,
    formData: {
      forWhom: 'Other',
      visitedBefore: false,
      identificationNumber: referral.referralId || '',
      comments: `Referral #${referral.referralId} - ${referral.scanType} (${referral.bodyPart}). Note: ${referral.clinicalNote || 'N/A'}`,
      communicationPreference: 'Email',
      patientName: referral.patientName || '',
      patientEmail: referral.patientEmail || '',
      patientPhone: referral.patientPhone || '',
      patientAddress: referral.patientAddress || '',
      patientGender: referral.patientGender || '',
      patientDOB: referral.patientDob || '',
    },
    notes: `Medical Referral from ${referral.doctorName || 'Doctor'} (${referral.doctorSpecialty || 'Specialist'}) at ${referral.doctorPractice || 'Medical Center'}. Facility: ${referral.facilityName || 'Diagnostic Center'}. Priority: ${referral.priority || 'Routine'}.`,
  };
};

/**
 * Sync created referral booking to Patient Client API (POST /api/v1/appointments/book)
 */
export const syncReferralToPatientApp = async (referral) => {
  const targetUrl = `${PATIENT_API_BASE_URL}/api/v1/appointments/book`;
  const payload = buildPatientBookingPayload(referral);

  console.log(`📡 [PatientSync] Syncing referral ${referral.referralId} to Patient API: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      const appointmentId = data.data?.appointment?.id || data.appointment?.id || data.data?.id || `APT-${Date.now()}`;
      console.log(`✅ [PatientSync] Successfully synced referral ${referral.referralId}. Patient Appointment ID: ${appointmentId}`);
      return {
        success: true,
        patientAppointmentId: String(appointmentId),
        patientSyncStatus: 'Synced',
        data,
      };
    } else {
      const errorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
      console.warn(`⚠️ [PatientSync] Patient API returned non-success for ${referral.referralId}:`, errorMsg);
      return {
        success: false,
        patientSyncStatus: 'Failed',
        error: errorMsg,
      };
    }
  } catch (err) {
    console.error(`❌ [PatientSync] Failed to reach Patient API for referral ${referral.referralId}:`, err.message);
    return {
      success: false,
      patientSyncStatus: 'Failed',
      error: err.message || 'Network error reaching Patient API',
    };
  }
};

/**
 * Confirm appointment payment on Patient Client API
 */
export const confirmPatientAppBooking = async (referral, paymentDetails = {}) => {
  if (!referral.patientAppointmentId) {
    console.log(`ℹ️ [PatientSync] Referral ${referral.referralId} does not have a synced patientAppointmentId. Attempting full sync.`);
    const syncRes = await syncReferralToPatientApp(referral);
    if (!syncRes.success) {
      return syncRes;
    }
    referral.patientAppointmentId = syncRes.patientAppointmentId;
  }

  const appointmentId = referral.patientAppointmentId;
  const targetUrl = `${PATIENT_API_BASE_URL}/api/v1/appointments/${appointmentId}/confirm`;

  console.log(`📡 [PatientSync] Confirming appointment ${appointmentId} on Patient API: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'confirm',
        payment: {
          status: 'paid',
          amount: referral.facilityPrice || 0,
          method: paymentDetails.paymentMethod || 'Card Payment',
          reference: paymentDetails.reference || `REF-PAY-${Date.now()}`,
          paidAt: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      console.log(`✅ [PatientSync] Successfully confirmed patient appointment ${appointmentId}`);
      return { success: true, data };
    } else {
      console.warn(`⚠️ [PatientSync] Patient API confirmation returned status ${response.status}:`, data?.message);
      return { success: false, error: data?.message || `HTTP ${response.status}` };
    }
  } catch (err) {
    console.error(`❌ [PatientSync] Error confirming patient appointment ${appointmentId}:`, err.message);
    return { success: false, error: err.message };
  }
};
