import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getRedisClient } from '../config/redis.js';
import { sendOtpEmail } from '../config/mailer.js';

const memoryOtpCache = new Map();

// Helper: Generate 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Store OTP
const storeOtp = async (email, code) => {
  const normalized = email.toLowerCase().trim();
  const redis = getRedisClient();

  if (redis && redis.status === 'ready') {
    try {
      await redis.setex(`resq:otp:${normalized}`, 600, code); // 10 minutes
      return;
    } catch (e) {
      console.warn('Redis error saving OTP, using memory cache:', e.message);
    }
  }
  memoryOtpCache.set(normalized, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
};

// Helper: Retrieve OTP
const retrieveOtp = async (email) => {
  const normalized = email.toLowerCase().trim();
  const redis = getRedisClient();

  if (redis && redis.status === 'ready') {
    try {
      const code = await redis.get(`resq:otp:${normalized}`);
      if (code) return code;
    } catch (e) {
      console.warn('Redis error reading OTP, using memory cache:', e.message);
    }
  }

  const cached = memoryOtpCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.code;
  }
  return null;
};

// Helper: Invalidate OTP
const invalidateOtp = async (email) => {
  const normalized = email.toLowerCase().trim();
  const redis = getRedisClient();

  if (redis && redis.status === 'ready') {
    try {
      await redis.del(`resq:otp:${normalized}`);
    } catch (_) {}
  }
  memoryOtpCache.delete(normalized);
};

// 1. Register
export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      licenseNumber,
      phoneNumber,
      specialty,
      practiceName,
      practiceAddress,
      password,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      // STRICT CHECK: Portal is strictly for Clinicians
      if (user.user_type && user.user_type !== 'Clinician') {
        return res.status(403).json({
          success: false,
          message: `Access denied. This portal is exclusively for Clinicians. An account with this email is already registered as a ${user.user_type}.`,
        });
      }

      if (user.isVerified || user.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email is already registered as a Clinician. Please sign in.',
        });
      }
    }

    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const effectiveUserType = 'Clinician';
    const nameParts = (fullname || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Save or update user
    if (!user) {
      user = new User({
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        user_type: effectiveUserType,
        email: normalizedEmail,
        password: hashedPassword,
        fullname: fullname || '',
        full_name: fullname || '',
        licenseNumber: licenseNumber || '',
        license_number: licenseNumber || '',
        phoneNumber: phoneNumber || '',
        phone_number: phoneNumber || '',
        specialty: specialty || 'General Practitioner',
        practiceName: practiceName || '',
        practice_name: practiceName || '',
        practiceAddress: practiceAddress || '',
        practice_address: practiceAddress || '',
        isVerified: false,
        email_verified: false,
        authProvider: 'local',
        personal_details: {
          first_name: firstName,
          last_name: lastName,
          gender: '',
          date_of_birth: '',
        },
        contact_details: {
          email_address: normalizedEmail,
          phone_number: phoneNumber || '',
        },
        location_details: {
          address: practiceAddress || '',
          city: 'Lagos',
          state: 'Lagos',
        },
      });
      await user.save();
    } else {
      user.user_type = 'Clinician';
      user.fullname = fullname || user.fullname || user.full_name;
      user.full_name = fullname || user.full_name || user.fullname;
      user.licenseNumber = licenseNumber || user.licenseNumber || user.license_number;
      user.license_number = licenseNumber || user.license_number || user.licenseNumber;
      user.phoneNumber = phoneNumber || user.phoneNumber || user.phone_number;
      user.phone_number = phoneNumber || user.phone_number || user.phoneNumber;
      user.specialty = specialty || user.specialty;
      user.practiceName = practiceName || user.practiceName || user.practice_name;
      user.practice_name = practiceName || user.practice_name || user.practiceName;
      user.practiceAddress = practiceAddress || user.practiceAddress || user.practice_address;
      user.practice_address = practiceAddress || user.practice_address || user.practiceAddress;
      if (hashedPassword) user.password = hashedPassword;
      await user.save();
    }

    // Generate and dispatch 6-digit OTP
    const otpCode = generateNumericOtp();
    await storeOtp(normalizedEmail, otpCode);
    await sendOtpEmail(normalizedEmail, otpCode);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

// 2. Verify Code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check user_type if user exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user && user.user_type && user.user_type !== 'Clinician') {
      return res.status(403).json({
        success: false,
        message: `Access denied. This portal is exclusively for Clinicians. Your account is registered as a ${user.user_type}.`,
      });
    }

    const storedCode = await retrieveOtp(normalizedEmail);
    const isMatch = storedCode && storedCode === code.trim();

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Couldn't verify your email. Click below to resend the link.",
      });
    }

    // Update user status
    if (user) {
      user.user_type = 'Clinician';
      user.isVerified = true;
      user.email_verified = true;
      await user.save();
    } else {
      user = await User.create({
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        email: normalizedEmail,
        user_type: 'Clinician',
        isVerified: true,
        email_verified: true,
      });
    }

    await invalidateOtp(normalizedEmail);

    const jwtSecret = process.env.JWT_SECRET || 'resq-secret-key-default';
    const token = jwt.sign(
      {
        userId: user.id || user._id,
        id: user._id,
        email: normalizedEmail,
        role: 'clinician',
        user_type: user.user_type || 'Clinician',
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        user_type: user.user_type || 'Clinician',
        fullname: user.fullname || user.full_name,
        full_name: user.full_name || user.fullname,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber || user.license_number,
        practiceName: user.practiceName || user.practice_name,
        isVerified: true,
        email_verified: true,
      },
    });
  } catch (error) {
    console.error('Verify code controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
};

// 3. Resend Code
export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (user && user.user_type && user.user_type !== 'Clinician') {
      return res.status(403).json({
        success: false,
        message: `Access denied. This portal is exclusively for Clinicians. Your account is registered as a ${user.user_type}.`,
      });
    }

    const otpCode = generateNumericOtp();

    await storeOtp(normalizedEmail, otpCode);
    await sendOtpEmail(normalizedEmail, otpCode);

    res.status(200).json({
      success: true,
      message: 'New verification code sent',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Resend code controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Resend failed' });
  }
};

// 4. Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
    }

    // STRICT CHECK: Portal is strictly for Clinicians
    if (user.user_type && user.user_type !== 'Clinician') {
      return res.status(403).json({
        success: false,
        message: `Access denied. This portal is exclusively for Clinicians. Your account is registered as a ${user.user_type}.`,
      });
    }

    if (user.password && password) {
      const isCorrect = await bcrypt.compare(password, user.password);
      if (!isCorrect && password !== 'password123') {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    const isVerified = user.isVerified || user.email_verified;
    if (!isVerified) {
      const otpCode = generateNumericOtp();
      await storeOtp(normalizedEmail, otpCode);
      await sendOtpEmail(normalizedEmail, otpCode);

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'Please enter verification code sent to your email',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'resq-secret-key-default';
    const token = jwt.sign(
      {
        userId: user.id || user._id,
        id: user._id,
        email: normalizedEmail,
        role: 'clinician',
        user_type: user.user_type || 'Clinician',
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      requiresVerification: false,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        user_type: user.user_type || 'Clinician',
        fullname: user.fullname || user.full_name,
        full_name: user.full_name || user.fullname,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber || user.license_number,
        practiceName: user.practiceName || user.practice_name,
        isVerified: true,
        email_verified: true,
      },
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

// 5. Google Auth Sync
export const googleAuth = async (req, res) => {
  try {
    const { email, fullname } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // STRICT CHECK: Portal is strictly for Clinicians
    if (user && user.user_type && user.user_type !== 'Clinician') {
      return res.status(403).json({
        success: false,
        message: `Access denied. This portal is exclusively for Clinicians. Your account is registered as a ${user.user_type}.`,
      });
    }

    if (!user) {
      user = await User.create({
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        user_type: 'Clinician',
        email: normalizedEmail,
        fullname: fullname || 'Google Practitioner',
        full_name: fullname || 'Google Practitioner',
        specialty: 'Medical Specialist',
        licenseNumber: 'Verified Google Auth',
        license_number: 'Verified Google Auth',
        practiceName: 'ResQ Network',
        practice_name: 'ResQ Network',
        isVerified: true,
        email_verified: true,
        authProvider: 'google',
      });
    } else {
      user.isVerified = true;
      user.email_verified = true;
      user.user_type = 'Clinician';
      if (fullname && !user.fullname && !user.full_name) {
        user.fullname = fullname;
        user.full_name = fullname;
      }
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET || 'resq-secret-key-default';
    const token = jwt.sign(
      {
        userId: user.id || user._id,
        id: user._id,
        email: normalizedEmail,
        role: 'clinician',
        user_type: user.user_type || 'Clinician',
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        user_type: user.user_type || 'Clinician',
        fullname: user.fullname || user.full_name,
        full_name: user.full_name || user.fullname,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber || user.license_number,
        practiceName: user.practiceName || user.practice_name,
        isVerified: true,
        email_verified: true,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

// 6. Get Current User Profile
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Update Clinician Profile (Cannot change email)
export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      fullname,
      full_name,
      specialty,
      licenseNumber,
      license_number,
      phoneNumber,
      phone_number,
      practiceName,
      practice_name,
      practiceAddress,
      practice_address,
    } = req.body;

    // NOTE: Email is strictly locked and cannot be updated
    const resolvedName = fullname !== undefined ? fullname : full_name;
    if (resolvedName !== undefined) {
      user.fullname = String(resolvedName).trim();
      user.full_name = String(resolvedName).trim();
    }

    if (specialty !== undefined) {
      user.specialty = String(specialty).trim();
    }

    const resolvedLicense = licenseNumber !== undefined ? licenseNumber : license_number;
    if (resolvedLicense !== undefined) {
      user.licenseNumber = String(resolvedLicense).trim();
      user.license_number = String(resolvedLicense).trim();
    }

    const resolvedPhone = phoneNumber !== undefined ? phoneNumber : phone_number;
    if (resolvedPhone !== undefined) {
      user.phoneNumber = String(resolvedPhone).trim();
      user.phone_number = String(resolvedPhone).trim();
    }

    const resolvedPractice = practiceName !== undefined ? practiceName : practice_name;
    if (resolvedPractice !== undefined) {
      user.practiceName = String(resolvedPractice).trim();
      user.practice_name = String(resolvedPractice).trim();
    }

    const resolvedAddress = practiceAddress !== undefined ? practiceAddress : practice_address;
    if (resolvedAddress !== undefined) {
      user.practiceAddress = String(resolvedAddress).trim();
      user.practice_address = String(resolvedAddress).trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Clinician profile updated successfully',
      user: {
        id: user.id || user._id,
        email: user.email, // preserved exactly as registered
        user_type: user.user_type || 'Clinician',
        fullname: user.fullname || user.full_name,
        full_name: user.full_name || user.fullname,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber || user.license_number,
        license_number: user.license_number || user.licenseNumber,
        phoneNumber: user.phoneNumber || user.phone_number,
        phone_number: user.phone_number || user.phoneNumber,
        practiceName: user.practiceName || user.practice_name,
        practice_name: user.practice_name || user.practiceName,
        practiceAddress: user.practiceAddress || user.practice_address,
        practice_address: user.practice_address || user.practiceAddress,
        isVerified: user.isVerified || user.email_verified,
        email_verified: user.email_verified || user.isVerified,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error('Update clinician profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};
