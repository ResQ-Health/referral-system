import React from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Star,
} from 'lucide-react';
import type { Facility } from './FacilityMarketplace';
import { SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import { SearchableSelect } from './SearchableSelect';

interface BookingSummaryProps {
  user: {
    fullname?: string;
    email?: string;
    specialty?: string;
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
      {/* Top Navbar */}
      <header className="marketplace-navbar">
        <div className="marketplace-nav-left">
          <button type="button" onClick={onBackToMarketplace} className="btn-back-clean" title="Back">
            <ArrowLeft size={18} />
          </button>
          <img src="/logo.png" alt="RESQ" className="resq-sidebar-logo" />
        </div>

        <div className="marketplace-nav-center">
          <button type="button" className="market-nav-tab" onClick={onBackToMarketplace}>
            <span>Referral</span>
          </button>
          <button type="button" className="market-nav-tab active">
            <span>Marketplace</span>
          </button>
        </div>

        <div className="marketplace-nav-right">
          <div className="marketplace-doctor-pill">
            <div className="doctor-avatar-circle">
              {doctorInitial}
            </div>
            <span className="doctor-pill-name">{doctorName}</span>
          </div>
        </div>
      </header>

      {/* Sub-Header: Breadcrumbs & Emergency Alert */}
      <div className="summary-breadcrumb-bar">
        <div className="breadcrumb-left">
          <button type="button" className="btn-back-link" onClick={onBackToMarketplace}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="breadcrumb-item active">Booking Summary</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item muted">Payment</span>
        </div>

        <div className="emergency-alert-tag">
          <AlertTriangle size={15} className="emergency-icon" />
          <span>Is this an emergency?</span>
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
          <div className="booking-card">
            <h4 className="booking-card-label">Referring Clinician</h4>
            <div className="clinician-profile-row">
              <div className="clinician-avatar-badge">
                {doctorInitial}
              </div>
              <div className="clinician-names-col">
                <span className="clinician-primary-name">{doctorName}</span>
                <span className="clinician-sub-specialty">{doctorSpecialty}</span>
              </div>
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
