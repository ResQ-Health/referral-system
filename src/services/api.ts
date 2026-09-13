import type { RegistrationData } from '../components/Registration';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    email: string;
    fullname?: string;
    specialty?: string;
    licenseNumber?: string;
    practiceName?: string;
    isVerified?: boolean;
  };
  requiresVerification?: boolean;
  email?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiRegister(data: RegistrationData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Registration failed');
  }
  return json;
}

export async function apiVerifyCode(email: string, code: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Couldn't verify your email.");
    }
    return json;
  } catch (err: any) {
    console.error('API error in apiVerifyCode:', err.message);
    throw err;
  }
}

export async function apiResendCode(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('API error in apiResendCode:', err.message);
    return { success: true, message: 'New verification code sent.' };
  }
}

export async function apiLogin(email: string, pass: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Invalid email or password');
    }
    return json;
  } catch (err: any) {
    console.warn('API error in apiLogin:', err.message);
    throw err;
  }
}

export async function apiGoogleSync(email: string, fullname?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullname }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Google authentication failed');
  }
  return json;
}

export interface ClinicalCatalogResponse {
  success: boolean;
  scanTypes: string[];
  bodyParts: string[];
  contrastOptions: string[];
  count?: {
    scanTypes: number;
    bodyParts: number;
  };
}

export async function apiGetClinicalCatalog(): Promise<ClinicalCatalogResponse> {
  try {
    const res = await fetch(`${API_BASE}/clinical/catalog`);
    if (!res.ok) {
      throw new Error(`Failed to fetch clinical catalog: ${res.statusText}`);
    }
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn('apiGetClinicalCatalog falling back to defaults:', err.message);
    // Return graceful fallback
    const { SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } = await import('../components/FacilityMarketplace');
    return {
      success: true,
      scanTypes: SCAN_TYPES,
      bodyParts: BODY_PARTS,
      contrastOptions: CONTRAST_OPTIONS,
    };
  }
}

export interface ApiReferralItem {
  _id?: string;
  referralId: string;
  doctorEmail: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPractice?: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  patientGender?: string;
  patientDob?: string;
  patientAddress?: string;
  scanType: string;
  bodyPart: string;
  contrastOption?: string;
  clinicalNote?: string;
  priority?: string;
  facilityId?: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityPrice?: number;
  slot?: {
    date?: string;
    time?: string;
    display?: string;
  };
  status: string;
  paymentStatus: string;
  referralLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper: Construct authenticated request headers
export function getAuthHeaders(includeContentType = true): Record<string, string> {
  const token = localStorage.getItem('resq_token');
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiCreateReferral(data: Partial<ApiReferralItem>): Promise<{ success: boolean; referral: ApiReferralItem; message?: string }> {
  const res = await fetch(`${API_BASE}/referrals`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to create referral');
  }
  return json;
}

export async function apiGetReferrals(doctorEmail?: string): Promise<{ success: boolean; referrals: ApiReferralItem[]; count: number }> {
  const url = doctorEmail
    ? `${API_BASE}/referrals?doctorEmail=${encodeURIComponent(doctorEmail)}`
    : `${API_BASE}/referrals`;
  const res = await fetch(url, {
    headers: getAuthHeaders(false),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch referrals');
  }
  return json;
}

export async function apiGetReferralById(id: string): Promise<{ success: boolean; referral: ApiReferralItem }> {
  const res = await fetch(`${API_BASE}/referrals/${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch referral');
  }
  return json;
}

export async function apiPayReferral(
  id: string,
  paymentDetails: { paymentMethod?: string; reference?: string } = {}
): Promise<{ success: boolean; referral: ApiReferralItem; message: string }> {
  const res = await fetch(`${API_BASE}/referrals/${encodeURIComponent(id)}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentDetails),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to process payment');
  }
  return json;
}

export interface PatientLookupResponse {
  success: boolean;
  found: boolean;
  message?: string;
  patient?: {
    id: string;
    fullName: string;
    gender: string;
    dob: string;
    email: string;
    phone: string;
    address: string;
    source?: string;
  };
}

export async function apiLookupPatient(email: string): Promise<PatientLookupResponse> {
  try {
    const res = await fetch(`${API_BASE}/patients/lookup?email=${encodeURIComponent(email.trim())}`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) {
      return { success: false, found: false, message: 'Lookup failed' };
    }
    return await res.json();
  } catch (err: any) {
    console.warn('API error looking up patient:', err.message);
    return { success: false, found: false, message: err.message };
  }
}

export interface PatientsListResponse {
  success: boolean;
  patients: Array<{
    id: string;
    name: string;
    email: string;
    gender: string;
    dob: string;
    phone: string;
    address: string;
    createdRelative: string;
    createdDate: string;
    initials: string;
  }>;
}

export async function apiGetPatients(): Promise<PatientsListResponse> {
  try {
    const res = await fetch(`${API_BASE}/patients`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) {
      return { success: false, patients: [] };
    }
    return await res.json();
  } catch (err: any) {
    console.warn('API error fetching patients:', err.message);
    return { success: false, patients: [] };
  }
}

export interface UpdateProfilePayload {
  fullname?: string;
  specialty?: string;
  licenseNumber?: string;
  phoneNumber?: string;
  practiceName?: string;
  practiceAddress?: string;
}

export async function apiUpdateProfile(payload: UpdateProfilePayload): Promise<{
  success: boolean;
  message: string;
  user: any;
}> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to update profile');
  }

  if (json.user) {
    try {
      const existing = localStorage.getItem('resq_user');
      const merged = existing ? { ...JSON.parse(existing), ...json.user } : json.user;
      localStorage.setItem('resq_user', JSON.stringify(merged));
    } catch (_) {
      localStorage.setItem('resq_user', JSON.stringify(json.user));
    }
  }

  return json;
}
