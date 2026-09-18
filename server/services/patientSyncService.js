import dotenv from 'dotenv';
dotenv.config();

const PATIENT_API_BASE_URL = (process.env.PATIENT_API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://resq-client.vercel.app')).replace(/\/+$/, '');

/**
 * Format raw date string into YYYY-MM-DD format (must be a valid future date for server-16)
 */
const formatBookingDate = (rawDate) => {
  const getFutureFallback = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (!rawDate) {
    return getFutureFallback();
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return getFutureFallback();
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

  const effectiveProviderId =
    referral.providerId ||
    (referral.facilityId && !referral.facilityId.startsWith('fac-') ? referral.facilityId : '') ||
    'CWZDBt9Xmv';

  const effectiveServiceId =
    referral.serviceId ||
    (referral.scanType && referral.scanType.length === 10 && !referral.scanType.includes(' ') ? referral.scanType : '') ||
    'P7S_Vf3fBt';

  const scanName = referral.serviceName || (referral.scanType
    ? `${referral.scanType}${referral.bodyPart ? ` (${referral.bodyPart})` : ''}`
    : 'Diagnostic Scan');
  const exactAmount = Number(referral.facilityPrice || referral.price || referral.amount || 0);

  return {
    providerId: effectiveProviderId,
    serviceId: effectiveServiceId,
    serviceName: scanName,
    scanType: referral.scanType || '',
    bodyPart: referral.bodyPart || '',
    facilityName: referral.facilityName || '',
    price: exactAmount,
    amount: exactAmount,
    facilityPrice: exactAmount,
    date,
    start_time: startTime,
    end_time: endTime,
    formData: {
      forWhom: 'Other',
      visitedBefore: false,
      identificationNumber: referral.referralId || '',
      referralId: referral.referralId || '',
      serviceName: scanName,
      scanType: referral.scanType || '',
      bodyPart: referral.bodyPart || '',
      facilityName: referral.facilityName || '',
      facilityPrice: exactAmount,
      price: exactAmount,
      amount: exactAmount,
      comments: `Referral #${referral.referralId} - ${scanName}. Note: ${referral.clinicalNote || 'N/A'}`,
      communicationPreference: 'Both',
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
 * Book appointment via Clinician-specific endpoint on Patient Client API
 * POST /api/v1/appointments/clinician/book
 * Requires the clinician's auth token to be forwarded.
 *
 * Server-16 API contract:
 * {
 *   providerId: string,    // facility/provider ID
 *   serviceId: string,     // scan type / service ID
 *   date: "YYYY-MM-DD",
 *   start_time: "HH:MM AM/PM",
 *   end_time: "HH:MM AM/PM",
 *   patientEmail: string,  // used to find or auto-create guest patient
 *   notes: string,
 * }
 */
export const bookClinicianAppointment = async (referral, clinicianToken) => {
  const targetUrl = `${PATIENT_API_BASE_URL}/api/v1/appointments/clinician/book`;

  const date = formatBookingDate(referral.slot?.date);
  const startTime = referral.slot?.time || '10:00 AM';
  const endTime = calculateEndTime(startTime) || '11:00 AM';

  // Ensure valid providerId and serviceId for server-16
  const effectiveProviderId =
    referral.providerId ||
    (referral.facilityId && !referral.facilityId.startsWith('fac-') ? referral.facilityId : '') ||
    'CWZDBt9Xmv';

  const effectiveServiceId =
    referral.serviceId ||
    (referral.scanType && referral.scanType.length === 10 && !referral.scanType.includes(' ') ? referral.scanType : '') ||
    'P7S_Vf3fBt';

  const notesText =
    referral.notes ||
    referral.clinicalNote ||
    `Referral #${referral.referralId} from ${referral.doctorName || 'Doctor'} (${referral.doctorSpecialty || 'Specialist'}) at ${referral.doctorPractice || 'Medical Center'}. Scan: ${referral.scanType || 'Diagnostic Scan'} - ${referral.bodyPart || 'Standard'}. Priority: ${referral.priority || 'Routine'}.`;

  const scanName = referral.serviceName || (referral.scanType
    ? `${referral.scanType}${referral.bodyPart ? ` (${referral.bodyPart})` : ''}`
    : 'Diagnostic Scan');
  const exactAmount = Number(referral.facilityPrice || referral.price || referral.amount || 0);

  const payload = {
    providerId: effectiveProviderId,
    serviceId: effectiveServiceId,
    serviceName: scanName,
    scanType: referral.scanType || '',
    bodyPart: referral.bodyPart || '',
    facilityName: referral.facilityName || '',
    price: exactAmount,
    amount: exactAmount,
    facilityPrice: exactAmount,
    date,
    start_time: startTime,
    end_time: endTime,
    patientEmail: referral.patientEmail || '',
    ...(referral.patientId ? { patientId: referral.patientId } : {}),
    patientName: referral.patientName || '',
    patientPhone: referral.patientPhone || '',
    notes: notesText.trim(),
    formData: {
      patientEmail: referral.patientEmail || '',
      clinicianEmail: referral.doctorEmail || '',
      serviceName: scanName,
      scanType: referral.scanType || '',
      bodyPart: referral.bodyPart || '',
      facilityName: referral.facilityName || '',
      facilityPrice: exactAmount,
      price: exactAmount,
      amount: exactAmount,
      referralId: referral.referralId || '',
      identificationNumber: referral.referralId || '',
      comments: `Referral #${referral.referralId} - ${scanName}. Note: ${referral.clinicalNote || referral.notes || 'N/A'}`,
      ...(referral.formData && typeof referral.formData === 'object' ? referral.formData : {}),
    },
  };

  console.log(`📡 [ClinicianSync] Booking referral ${referral.referralId} via clinician endpoint: ${targetUrl}`, JSON.stringify(payload));

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (clinicianToken) {
    headers['Authorization'] = clinicianToken.startsWith('Bearer ')
      ? clinicianToken
      : `Bearer ${clinicianToken}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success) {
      const apptId = data.data?.appointment?.id || data.data?.appointment?._id || data.data?.id || data.appointment?.id || `CLINICIAN-APT-${Date.now()}`;
      console.log(`✅ [ClinicianSync] Successfully booked clinician appointment for referral ${referral.referralId}. Appointment ID: ${apptId}`);
      return {
        success: true,
        clinicianAppointmentId: String(apptId),
        clinicianSyncStatus: 'Synced',
        data,
      };
    } else {
      const errorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
      console.warn(`⚠️ [ClinicianSync] Clinician API returned non-success for ${referral.referralId}:`, errorMsg);
      return {
        success: false,
        clinicianSyncStatus: 'Failed',
        error: errorMsg,
      };
    }
  } catch (err) {
    console.error(`❌ [ClinicianSync] Failed to reach Clinician API for referral ${referral.referralId}:`, err.message);
    return {
      success: false,
      clinicianSyncStatus: 'Failed',
      error: err.message || 'Network error reaching Clinician API',
    };
  }
};

/**
 * Fetch all clinician booked appointments from Patient Client API
 * GET /api/v1/appointments/clinician
 */
export const getClinicianAppointments = async (clinicianToken) => {
  const targetUrl = `${PATIENT_API_BASE_URL}/api/v1/appointments/clinician`;

  console.log(`📡 [ClinicianSync] Fetching clinician appointments from: ${targetUrl}`);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (clinicianToken) {
    headers['Authorization'] = clinicianToken.startsWith('Bearer ')
      ? clinicianToken
      : `Bearer ${clinicianToken}`;
  }

  try {
    const response = await fetch(targetUrl, { method: 'GET', headers });
    const data = await response.json().catch(() => null);

    if (response.ok) {
      const appointments = data?.data?.appointments || data?.appointments || data?.data || [];
      console.log(`✅ [ClinicianSync] Fetched ${Array.isArray(appointments) ? appointments.length : 0} clinician appointments`);
      return { success: true, appointments, raw: data };
    } else {
      const errorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
      console.warn(`⚠️ [ClinicianSync] Failed to fetch clinician appointments:`, errorMsg);
      return { success: false, appointments: [], error: errorMsg };
    }
  } catch (err) {
    console.error(`❌ [ClinicianSync] Error fetching clinician appointments:`, err.message);
    return { success: false, appointments: [], error: err.message };
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
  const targetUrl = `${PATIENT_API_BASE_URL}/api/v1/appointments/${appointmentId}/confirm-payment`;

  console.log(`📡 [PatientSync] Confirming appointment ${appointmentId} on Patient API: ${targetUrl}`);

  try {
    const payload = {
      appointmentId,
      paymentMethod: paymentDetails.paymentMethod || 'Card Payment',
      reference: paymentDetails.reference || `REF-PAY-${Date.now()}`,
      amount: referral.facilityPrice || 0,
    };

    let response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // If 404 on PUT endpoint, try fallback to POST /api/v1/payments/confirm-appointment
    if (response.status === 404) {
      const fallbackUrl = `${PATIENT_API_BASE_URL}/api/v1/payments/confirm-appointment`;
      response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

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
