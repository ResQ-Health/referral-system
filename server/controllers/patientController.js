import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';

// Format Date of Birth to DD/MM/YYYY or readable format if needed
const formatDob = (raw) => {
  if (!raw) return '';
  // If in YYYY-MM-DD format, convert to MM/DD/YYYY or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-');
    return `${m}/${d}/${y}`;
  }
  return raw;
};

// 1. Lookup patient by email from users collection or referrals collection
export const lookupPatient = async (req, res) => {
  try {
    const rawEmail = req.query.email || req.body?.email || '';
    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ success: false, message: 'Email query parameter is required' });
    }

    const email = rawEmail.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    // 1. Search in users collection
    const user = await User.findOne({
      $or: [
        { email: emailRegex },
        { 'contact_details.email_address': emailRegex },
      ],
    });

    if (user) {
      const first = user.personal_details?.first_name || '';
      const last = user.personal_details?.last_name || '';
      const compositeName = `${first} ${last}`.trim();
      const fullName = user.full_name || user.fullname || compositeName || 'ResQ Patient';

      const gender = user.gender || user.personal_details?.gender || '';
      const rawDob = user.dob || user.date_of_birth || user.personal_details?.date_of_birth || '';
      const dob = formatDob(rawDob);

      const phone =
        user.phone_number ||
        user.phoneNumber ||
        user.contact_details?.phone_number ||
        '';

      const address =
        user.address ||
        user.location_details?.address ||
        (user.location_details?.city ? `${user.location_details.city}, ${user.location_details.state || ''}` : '');

      return res.status(200).json({
        success: true,
        found: true,
        patient: {
          id: user.id || user._id,
          fullName,
          gender: gender ? (gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) : '',
          dob,
          email: user.email || email,
          phone,
          address,
          source: 'user_account',
        },
      });
    }

    // 2. Search in previous referrals
    const referral = await Referral.findOne({
      patientEmail: emailRegex,
    }).sort({ createdAt: -1 });

    if (referral) {
      return res.status(200).json({
        success: true,
        found: true,
        patient: {
          id: referral._id,
          fullName: referral.patientName || '',
          gender: referral.patientGender || '',
          dob: referral.patientDob || '',
          email: referral.patientEmail || email,
          phone: referral.patientPhone || '',
          address: referral.patientAddress || '',
          source: 'previous_referral',
        },
      });
    }

    // Not found
    return res.status(200).json({
      success: true,
      found: false,
      message: 'No existing patient profile found for this email address.',
    });
  } catch (error) {
    console.error('Patient lookup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error looking up patient' });
  }
};

// 2. Get all patients (for existing patient directory)
export const getPatients = async (req, res) => {
  try {
    // Fetch users with user_type Patient or users with personal_details
    const users = await User.find({
      user_type: { $in: ['Patient', null] },
      email: { $not: /@resq\.com$/i }, // filter out internal guest seeds if desired
    })
      .sort({ createdAt: -1 })
      .limit(60);

    const patientsMap = new Map();

    users.forEach((u) => {
      const email = (u.email || u.contact_details?.email_address || '').toLowerCase().trim();
      if (!email) return;

      const first = u.personal_details?.first_name || '';
      const last = u.personal_details?.last_name || '';
      const compositeName = `${first} ${last}`.trim();
      const name = u.full_name || u.fullname || compositeName || 'Patient';

      const initials = name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P';

      patientsMap.set(email, {
        id: u.id || String(u._id),
        name,
        email,
        gender: u.gender || u.personal_details?.gender || 'Male',
        dob: formatDob(u.dob || u.date_of_birth || u.personal_details?.date_of_birth || ''),
        phone: u.phone_number || u.phoneNumber || u.contact_details?.phone_number || '',
        address: u.address || u.location_details?.address || '',
        createdRelative: 'Recently',
        createdDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '11/01/2026',
        initials,
      });
    });

    // Also pull from referrals
    const referrals = await Referral.find({}).sort({ createdAt: -1 }).limit(100);
    referrals.forEach((r) => {
      const email = (r.patientEmail || '').toLowerCase().trim();
      if (!email || patientsMap.has(email)) return;

      const name = r.patientName || 'Patient';
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'P';

      patientsMap.set(email, {
        id: String(r._id),
        name,
        email,
        gender: r.patientGender || 'Male',
        dob: r.patientDob || '',
        phone: r.patientPhone || '',
        address: r.patientAddress || '',
        createdRelative: 'Recently',
        createdDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '11/01/2026',
        initials,
      });
    });

    const patients = Array.from(patientsMap.values());
    res.status(200).json({
      success: true,
      patients,
      count: patients.length,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching patients' });
  }
};
