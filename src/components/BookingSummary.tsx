import React from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Star,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { Facility } from './FacilityMarketplace';
import { SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import { SearchableSelect } from './SearchableSelect';

interface BookingSummaryProps {
  user: {
    fullname?: string;
    email?: string;
    specialty?: string;
    licenseNumber?: string;
    practiceName?: string;
    phoneNumber?: string;
  };
  facility: Facility;
  slot: {
    date: string;
    time: string;
    display: string;
  };
  patientName: string;
  referralData: {
    scanType: string;
    bodyPart: string;
    clinicalNote: string;
    contrastOption?: string;
  };
  onBackToMarketplace: () => void;
  onEditBooking: () => void;
  onSubmitReferral: () => void;
  onUpdateReferralData: (updated: { scanType: string; bodyPart: string; clinicalNote: string; contrastOption?: string }) => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  user,
  facility,
  slot,
  referralData,
  onBackToMarketplace,
  onEditBooking,
  onSubmitReferral,
  onUpdateReferralData,
}) => {
  const doctorDisplayName = user.fullname?.trim() || 'Enaikele Omoh Kelvin';
  const doctorName = doctorDisplayName.toLowerCase().startsWith('dr.')
    ? doctorDisplayName
    : `Dr. ${doctorDisplayName}`;
  const doctorSpecialty = user.specialty?.trim() || 'Consultant Specialist';
  const doctorInitial = (doctorDisplayName.toLowerCase().startsWith('dr.')
    ? doctorDisplayName.substring(3).trim()
    : doctorDisplayName
  ).charAt(0).toUpperCase() || 'E';

  return (
    <div className="booking-summary-layout">
      {/* Redesigned Executive Top Header */}
      <header className="marketplace-navbar">
        <div className="marketplace-nav-left">
          <button type="button" onClick={onBackToMarketplace} className="btn-back-clean" title="Back to Marketplace">
            <ArrowLeft size={16} />
          </button>
          <div
            className="marketplace-brand-wrap"
            onClick={onBackToMarketplace}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img src="/logo.png" alt="ResQ" className="resq-sidebar-logo" />
            <span className="resq-brand-text-lg">ResQ</span>
          </div>
          <div className="marketplace-nav-divider-v" />
          <span className="marketplace-flow-badge">Clinical Referral</span>
        </div>

        <div className="marketplace-nav-center">
          <nav className="marketplace-stepper-pills">
            <button
              type="button"
              className="market-nav-step-pill completed"
              onClick={onBackToMarketplace}
              title="Return to Step 1: Referral Summary"
            >
              <span className="step-pill-number">✓</span>
              <span className="step-pill-text">Summary</span>
            </button>
            <div className="market-stepper-line completed" />
            <button
              type="button"
              className="market-nav-step-pill completed"
              onClick={onBackToMarketplace}
              title="Return to Step 2: Diagnostic Provider Selection"
            >
              <span className="step-pill-number">✓</span>
              <span className="step-pill-text">Provider</span>
            </button>
            <div className="market-stepper-line active" />
            <button
              type="button"
              className="market-nav-step-pill active"
              title="Step 3: Booking Summary & Final Submission"
            >
              <span className="step-pill-number">3</span>
              <span className="step-pill-text">Booking</span>
            </button>
          </nav>
        </div>

        <div className="marketplace-nav-right">
          <div className="marketplace-doctor-pill">
            <div className="doctor-avatar-circle">
              {doctorInitial}
            </div>
            <div className="doctor-pill-info">
              <div className="doctor-pill-name-row">
                <span className="doctor-pill-name">{doctorName}</span>
                <span className="doctor-verified-dot" title="Authenticated Clinician" />
              </div>
              <span className="doctor-pill-specialty">{doctorSpecialty}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header: Professional Clinical Route Breadcrumbs */}
      <div className="summary-breadcrumb-bar">
        <div className="breadcrumb-left">
          <button type="button" className="btn-back-link" onClick={onBackToMarketplace}>
            <ArrowLeft size={15} />
            <span>Back to Provider Selection</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">Order Summary & Appointment Hold</span>
        </div>

        <div className="clinical-clearance-badge">
          <span className="clearance-dot" />
          <span>Slot Reserved • Pending Center Clearance</span>
        </div>
      </div>

      {/* Main 2-Column Body */}
      <div className="booking-summary-body">
        {/* Left Column: Facility Information & Pricing */}
        <div className="booking-left-col">
          <div className="facility-summary-card">
            <div className="facility-thumb-wrap">
              <img src={facility.image} alt={facility.name} className="facility-thumb-img" />
            </div>

            <h2 className="facility-summary-name">{facility.name}</h2>
            <p className="facility-summary-address">{facility.address}</p>
            <p className="facility-summary-slot">{slot.display || 'Wed, 5th Feb at 2:30PM'}</p>

            <div className="facility-summary-rating">
              <span className="rating-num">{facility.rating}</span>
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <span className="rating-total">({facility.reviewsCount})</span>
            </div>

            <button type="button" className="btn-edit-booking" onClick={onEditBooking}>
              Edit booking
            </button>

            <div className="facility-total-cost-box">
              <span className="cost-label">Total Cost:</span>
              <span className="cost-value">₦{facility.price.toLocaleString()}</span>
            </div>
          </div>

          <p className="recaptcha-legal-notice">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a> and{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a> apply.
          </p>
        </div>

        {/* Right Column: Clinician, Scan Details (UNLOCKED), and Submit */}
        <div className="booking-right-col">
          {/* Card 1: Referring Clinician */}
          <div className="booking-card clinician-auth-booking-card">
            <div className="booking-card-header-flex">
              <h4 className="booking-card-label" style={{ margin: 0 }}>Referring Clinician Authorization</h4>
              <span className="summary-status-pill pill-active-verified" style={{ margin: 0, padding: '2px 8px', fontSize: '11px' }}>
                <CheckCircle2 size={11} className="text-emerald" />
                <span>MDCN Verified</span>
              </span>
            </div>
            <div className="clinician-profile-row" style={{ marginTop: '12px' }}>
              <div className="clinician-avatar-badge-large" style={{ width: '42px', height: '42px', fontSize: '16px' }}>
                {doctorInitial}
              </div>
              <div className="clinician-names-col" style={{ gap: '2px' }}>
                <span className="clinician-primary-name" style={{ fontSize: '14.5px' }}>{doctorName}</span>
                <span className="clinician-sub-specialty" style={{ fontSize: '12px' }}>{doctorSpecialty} • {user.practiceName || 'ResQ Medical Center'}</span>
                <span className="clinician-license-num font-mono" style={{ fontSize: '11px', color: '#64748B' }}>License: {user.licenseNumber || 'MDCN-REG-847291'}</span>
              </div>
            </div>
            <div className="booking-clinician-signoff-line">
              <ShieldCheck size={13} className="text-emerald" />
              <span>Digitally signed requisition order attached & authorized for facility dispatch</span>
            </div>
          </div>

          {/* Card 2: Scan Details (UNLOCKED, NO LOCK ICONS!) */}
          <div className="booking-card">
            <h4 className="booking-card-label">Scan Details</h4>

            <div className="scan-details-grid-unlocked">
              <div className="scan-field-group">
                <label className="scan-field-label">Scan Type</label>
                <select
                  value={referralData.scanType || 'MRI Scan (Magnetic Resonance Imaging)'}
                  onChange={(e) => onUpdateReferralData({ ...referralData, scanType: e.target.value })}
                  className="scan-unlocked-input"
                >
                  {SCAN_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="scan-field-group">
                <SearchableSelect
                  label="Body Part"
                  labelClassName="scan-field-label"
                  options={BODY_PARTS}
                  value={referralData.bodyPart || 'Brain'}
                  onChange={(val) => onUpdateReferralData({ ...referralData, bodyPart: val })}
                  placeholder="Search & select body part..."
                />
              </div>

              <div className="scan-field-group">
                <label className="scan-field-label">Contrast Selection</label>
                <select
                  value={referralData.contrastOption || 'Not Specified'}
                  onChange={(e) => onUpdateReferralData({ ...referralData, contrastOption: e.target.value })}
                  className="scan-unlocked-input"
                >
                  {CONTRAST_OPTIONS.map((co) => (
                    <option key={co} value={co}>
                      {co}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="scan-field-group" style={{ marginTop: '14px' }}>
              <label className="scan-field-label">Clinical Note</label>
              <textarea
                value={referralData.clinicalNote}
                onChange={(e) => onUpdateReferralData({ ...referralData, clinicalNote: e.target.value })}
                className="scan-unlocked-textarea"
                rows={3}
                placeholder="Clinical notes..."
              />
            </div>
          </div>

          {/* Card 3: Important Notice */}
          <div className="important-alert-card">
            <div className="important-header-row">
              <AlertTriangle size={16} className="important-alert-icon" />
              <span className="important-title">Important</span>
            </div>
            <p className="important-text">
              The clinic needs to give the "thumbs up" on your selected time before we process payment.
              Keep an eye on your inbox—we'll let you know the moment you're cleared to pay.
            </p>
          </div>

          {/* Bottom Action Row */}
          <div className="booking-bottom-action-row">
            <div className="bottom-cost-display">
              <span>Total Cost:</span>
              <strong>₦{facility.price.toLocaleString()}</strong>
            </div>

            <button
              type="button"
              className="btn-submit-referral-blue"
              onClick={onSubmitReferral}
            >
              Submit Referral
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
