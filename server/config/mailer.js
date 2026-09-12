import nodemailer from 'nodemailer';

let transporter = null;

export const initMailer = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD missing. Emails will be logged to console.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const sendOtpEmail = async (toEmail, code) => {
  const user = process.env.EMAIL_USER;
  if (!transporter) {
    initMailer();
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #06202E; }
          .container { max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E1E3E6; border-radius: 12px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(6, 32, 46, 0.05); }
          .header { text-align: center; margin-bottom: 28px; }
          .title { font-size: 26px; font-weight: 700; color: #06202E; margin: 0 0 10px; }
          .subtitle { font-size: 14px; color: #586A73; line-height: 1.5; margin: 0; }
          .code-box { background: #F8FAFC; border: 2px solid #06202E; border-radius: 8px; padding: 18px 24px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #06202E; margin: 28px 0; }
          .footer { border-top: 1px solid #E1E3E6; padding-top: 20px; text-align: center; font-size: 12px; color: #586A73; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">We sent you a code</h1>
            <p class="subtitle">Please enter this verification code sent to your email address to verify your ResQ Healthcare account.</p>
          </div>
          <div class="code-box">
            ${code}
          </div>
          <p style="font-size: 13px; color: #586A73; text-align: center; margin-bottom: 28px;">
            This verification code is valid for <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
          </p>
          <div class="footer">
            2025 MedResQ Healthcare · Privacy Policy · Support
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[LOCAL DEV EMAIL] To: ${toEmail} | Verification Code: ${code}`);
    return { success: true, local: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"ResQ Healthcare" <${user}>`,
      to: toEmail,
      subject: `Your ResQ Verification Code: ${code}`,
      html,
    });
    console.log(`✓ Verification email sent to ${toEmail} (ID: ${info.messageId})`);
    return { success: true, info };
  } catch (error) {
    console.warn(`Could not send email via Gmail (${error.message}). Code is: ${code}`);
    return { success: false, error: error.message };
  }
};

export const sendPatientReferralEmail = async ({
  toEmail,
  patientName,
  doctorName,
  doctorSpecialty,
  doctorPractice,
  referralId,
  scanType,
  bodyPart,
  contrastOption,
  facilityName,
  slotDisplay,
  price,
  referralLink,
}) => {
  const user = process.env.EMAIL_USER;
  if (!transporter) {
    initMailer();
  }

  const formattedPrice = price && price > 0 ? `₦${Number(price).toLocaleString()}` : 'Price determined by facility';
  const effectiveDoctor = doctorName || 'Your Doctor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #06202E; }
          .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E1E3E6; border-radius: 14px; padding: 36px 32px; box-shadow: 0 4px 16px rgba(6, 32, 46, 0.06); }
          .logo-badge { display: inline-block; padding: 6px 14px; background: #EBF8FF; color: #0070F3; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 18px; letter-spacing: 0.5px; }
          .title { font-size: 24px; font-weight: 800; color: #06202E; margin: 0 0 10px; line-height: 1.3; }
          .subtitle { font-size: 15px; color: #586A73; line-height: 1.6; margin: 0 0 24px; }
          .details-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDF2F7; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748B; font-weight: 500; }
          .detail-value { color: #06202E; font-weight: 700; text-align: right; }
          .cta-box { text-align: center; margin: 30px 0 20px; }
          .cta-btn { display: inline-block; background-color: #0070F3; color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 112, 243, 0.3); }
          .cta-note { font-size: 13px; color: #64748B; margin-top: 12px; line-height: 1.5; }
          .footer { border-top: 1px solid #E1E3E6; padding-top: 20px; margin-top: 28px; text-align: center; font-size: 12px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-badge">RESQ HEALTHCARE REFERRAL</div>
          <h1 class="title">Medical Scan Referral Notice</h1>
          <p class="subtitle">
            Hello <strong>${patientName || 'Patient'}</strong>,<br>
            <strong>${effectiveDoctor}</strong> (${doctorSpecialty || 'Specialist'}${doctorPractice ? ` · ${doctorPractice}` : ''}) has referred you for a diagnostic imaging investigation.
          </p>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Referral ID:</span>
              <span class="detail-value" style="color: #0070F3;">${referralId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Recommended Scan:</span>
              <span class="detail-value">${scanType} - ${bodyPart}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Protocol:</span>
              <span class="detail-value">${contrastOption || 'Not Specified'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Facility / Center:</span>
              <span class="detail-value">${facilityName || 'Patient Choice (Open Referral)'}</span>
            </div>
            ${slotDisplay ? `
            <div class="detail-row">
              <span class="detail-label">Selected Appointment:</span>
              <span class="detail-value">${slotDisplay}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value" style="color: #0F766E;">${formattedPrice}</span>
            </div>
          </div>

          <div class="cta-box">
            <a href="${referralLink}" class="cta-btn" target="_blank">
              Review Booking & Complete Payment →
            </a>
            <p class="cta-note">
              Please click the link above to check your booking details, confirm your schedule, and continue to payment from your patient dashboard.
            </p>
          </div>

          <div class="footer">
            ResQ Healthcare Technologies · Connecting Patients and Diagnostics Across Africa<br>
            Need assistance? Reply directly to this email or visit our patient support center.
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[LOCAL DEV EMAIL] Referral email to: ${toEmail} | Link: ${referralLink}`);
    return { success: true, local: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"ResQ Healthcare" <${user}>`,
      to: toEmail,
      subject: `Medical Referral from ${effectiveDoctor}: ${scanType} - ${bodyPart} (Action Required)`,
      html,
    });
    console.log(`✓ Patient referral email sent to ${toEmail} (ID: ${info.messageId})`);
    return { success: true, info };
  } catch (error) {
    console.warn(`Could not send patient referral email via Gmail (${error.message}). Link: ${referralLink}`);
    return { success: false, error: error.message };
  }
};

