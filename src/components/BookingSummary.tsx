import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
  patientName,
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

  const [scanErrors, setScanErrors] = useState<{ scanType?: string; bodyPart?: string; contrastOption?: string }>({});

  const handleSubmit = () => {
    const errors: { scanType?: string; bodyPart?: string; contrastOption?: string } = {};
    if (!referralData.scanType?.trim()) errors.scanType = 'Scan type is required to proceed';
    if (!referralData.bodyPart?.trim()) errors.bodyPart = 'Body part is required to proceed';
    if (!referralData.contrastOption?.trim()) errors.contrastOption = 'Contrast option is required to proceed';
    if (Object.keys(errors).length > 0) {
      setScanErrors(errors);
      const el = document.getElementById('booking-summary-scan-card');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setScanErrors({});
    onSubmitReferral();
  };

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
            <span className="market-nav-step-divider">›</span>
            <button
              type="button"
              className="market-nav-step-pill completed"
              onClick={onBackToMarketplace}
              title="Return to Step 2: Select Provider"
            >
              <span className="step-pill-number">✓</span>
              <span className="step-pill-text">Provider</span>
            </button>
            <span className="market-nav-step-divider">›</span>
            <button
              type="button"
              className="market-nav-step-pill active"
              title="Current Step 3: Booking Summary"
            >
              <span className="step-pill-number">3</span>
              <span className="step-pill-text">Booking</span>
            </button>
          </nav>
        </div>

        <div className="marketplace-nav-right">
          <div className="marketplace-clinician-badge">
            <div className="clinician-avatar-badge">{doctorInitial}</div>
            <div className="clinician-badge-meta">
              <span className="clinician-badge-name">{doctorName}</span>
              <span className="clinician-badge-role">{doctorSpecialty}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="booking-summary-content">
        <h2 className="booking-page-title">Booking Summary</h2>

        <div className="booking-two-col-grid">
          {/* Left Column: Facility Card & Patient Info */}
          <div className="booking-left-col">
            {/* Facility Card */}
            <div className="booking-card">
              <div className="facility-summary-header">
                <div className="facility-sum-avatar">
                  {facility.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="facility-sum-info">
                  <h3 className="facility-sum-name">{facility.name}</h3>
                  <p className="facility-sum-address">{facility.address}</p>
                  <div className="facility-sum-rating-row">
                    <Star size={13} className="star-filled" />
                    <span className="rating-score">{facility.rating}</span>
                    <span className="review-count">({facility.reviewsCount} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="booking-detail-divider" />

              <div className="booking-meta-list">
                <div className="booking-meta-item">
                  <span className="meta-label">Selected Date & Time</span>
                  <span className="meta-value-highlight">{slot.display}</span>
                </div>
                <div className="booking-meta-item">
                  <span className="meta-label">Total Cost</span>
                  <span className="meta-price-large">₦{facility.price.toLocaleString()}</span>
                </div>
              </div>

              <button type="button" className="btn-edit-booking" onClick={onEditBooking} style={{ marginTop: '12px' }}>
                Edit booking
              </button>
            </div>

            {/* Patient Information Card */}
            <div className="booking-card">
              <h4 className="booking-card-label">Patient Information</h4>
              <div className="booking-meta-list">
                <div className="booking-meta-item">
                  <span className="meta-label">Full Name</span>
                  <span className="meta-value">{patientName}</span>
                </div>
                <div className="booking-meta-item">
                  <span className="meta-label">Referred By</span>
                  <span className="meta-value">{doctorName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clinician, Scan Details (UNLOCKED), and Submit */}
          <div className="booking-right-col">
            {/* Card 1: Referring Clinician Authorization */}
            <div className="referral-summary-card-executive clinician-auth-card-executive">
              <div className="referral-card-section-header">
                <div className="section-header-title-group">
                  <div className="section-icon-badge">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h3 className="referral-card-section-label">Referring Clinician Authorization</h3>
                    <p className="referral-card-section-desc">Medical Council Credentials & Order Verification</p>
                  </div>
                </div>
                <div className="clinician-auth-status-pill">
                  <CheckCircle2 size={13} />
                  <span>Authorized</span>
                </div>
              </div>

              <div className="clinician-profile-row-executive">
                <div className="clinician-avatar-badge-lg">
                  {doctorInitial}
                </div>
                <div className="clinician-profile-meta-main">
                  <div className="clinician-name-badge-row">
                    <h4 className="clinician-name-title">{doctorName}</h4>
                    <span className="clinician-verified-tag">MDCN Registered</span>
                  </div>
                  <p className="clinician-role-subtitle">{doctorSpecialty}</p>
                </div>
              </div>

              <div className="clinician-auth-footer-bar">
                <CheckCircle2 size={12} className="text-emerald" />
                <span>Digitally signed requisition order attached & authorized for facility dispatch</span>
              </div>
            </div>

            {/* Card 2: Scan Details (UNLOCKED, NO LOCK ICONS!) */}
            <div className="booking-card" id="booking-summary-scan-card">
              <h4 className="booking-card-label">Scan Details</h4>

              {Object.keys(scanErrors).length > 0 && (
                <div className="resq-scan-validation-alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Please fill in all required fields (Scan Type, Body Part, and Contrast) before submitting.</span>
                </div>
              )}

              <div className="scan-details-grid-unlocked">
                <div className="scan-field-group">
                  <label className="scan-field-label">
                    Scan Type <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={referralData.scanType || ''}
                    onChange={(e) => {
                      onUpdateReferralData({ ...referralData, scanType: e.target.value });
                      if (scanErrors.scanType) setScanErrors((prev) => ({ ...prev, scanType: '' }));
                    }}
                    className={`scan-unlocked-input ${scanErrors.scanType ? 'is-error' : ''}`}
                  >
                    <option value="">Select scan type</option>
                    {SCAN_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {scanErrors.scanType && (
                    <p className="resq-field-error-msg">
                      <AlertCircle size={12} />
                      <span>{scanErrors.scanType}</span>
                    </p>
                  )}
                </div>

                <div className="scan-field-group">
                  <SearchableSelect
                    label="Body Part"
                    labelClassName="scan-field-label"
                    required
                    error={scanErrors.bodyPart}
                    options={BODY_PARTS}
                    value={referralData.bodyPart || ''}
                    onChange={(val) => {
                      onUpdateReferralData({ ...referralData, bodyPart: val });
                      if (scanErrors.bodyPart) setScanErrors((prev) => ({ ...prev, bodyPart: '' }));
                    }}
                    placeholder="Search & select body part..."
                  />
                </div>

                <div className="scan-field-group">
                  <label className="scan-field-label">
                    Contrast Selection <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={referralData.contrastOption || ''}
                    onChange={(e) => {
                      onUpdateReferralData({ ...referralData, contrastOption: e.target.value });
                      if (scanErrors.contrastOption) setScanErrors((prev) => ({ ...prev, contrastOption: '' }));
                    }}
                    className={`scan-unlocked-input ${scanErrors.contrastOption ? 'is-error' : ''}`}
                  >
                    <option value="">Select contrast option</option>
                    {CONTRAST_OPTIONS.map((co) => (
                      <option key={co} value={co}>
                        {co}
                      </option>
                    ))}
                  </select>
                  {scanErrors.contrastOption && (
                    <p className="resq-field-error-msg">
                      <AlertCircle size={12} />
                      <span>{scanErrors.contrastOption}</span>
                    </p>
                  )}
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
                onClick={handleSubmit}
              >
                Submit Referral
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
