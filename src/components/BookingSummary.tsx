import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Star,
  Activity,
} from 'lucide-react';
import type { Facility } from './FacilityMarketplace';
import { SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import { SearchableSelect } from './SearchableSelect';
import { scrollToTop } from '../utils/scrollHelper';

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

  // Ensure user always starts at the top of the booking summary page
  useEffect(() => {
    scrollToTop();
  }, []);

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
      {/* Executive Top Header Navbar */}
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
          <div className="marketplace-doctor-pill">
            <div className="doctor-avatar-circle">{doctorInitial}</div>
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

      {/* Main Content Container */}
      <main className="booking-summary-content-wrapper">
        {/* Executive Header Banner */}
        <div className="booking-summary-header-banner">
          <div className="booking-banner-top-row">
            <button
              type="button"
              className="booking-nav-back-pill"
              onClick={onBackToMarketplace}
              title="Return to Step 2: Facility Marketplace"
            >
              <ArrowLeft size={13} />
              <span>Back to Facilities</span>
            </button>

            <div className="booking-status-pill">
              <CheckCircle2 size={13} className="text-emerald" />
              <span>Step 3 of 3: Booking & Authorization</span>
            </div>
          </div>

          <div className="booking-banner-title-block">
            <h1 className="booking-summary-page-title">Booking Summary & Order Dispatch</h1>
            <p className="booking-summary-page-subtitle">
              Verify scheduled diagnostic appointment slot, clinical parameters, and referring clinician authorization before final dispatch.
            </p>
          </div>
        </div>

        {/* Structured 2-Column Responsive Grid */}
        <div className="booking-summary-main-grid">
          {/* Left Column: Facility Summary & Patient Card */}
          <aside className="booking-summary-col-left">
            {/* Facility & Appointment Card */}
            <div className="booking-summary-card facility-card-redesigned">
              <div className="booking-summary-card-header">
                <div className="facility-avatar-box">
                  <Building2 size={20} className="facility-avatar-icon" />
                </div>
                <div className="facility-title-info">
                  <span className="facility-kicker">SELECTED DIAGNOSTIC CENTER</span>
                  <h3 className="facility-name-heading">{facility.name}</h3>
                  <p className="facility-address-text">{facility.address}</p>
                </div>
              </div>

              <div className="facility-rating-badge-row">
                <div className="rating-pill">
                  <Star size={13} className="star-gold" />
                  <span className="rating-num">{facility.rating}</span>
                  <span className="reviews-num">({facility.reviewsCount} reviews)</span>
                </div>
                <span className="verified-facility-tag">
                  <ShieldCheck size={12} />
                  <span>Accredited Center</span>
                </span>
              </div>

              <div className="booking-card-divider" />

              {/* Slot & Appointment Schedule Banner */}
              <div className="booking-slot-highlight-box">
                <div className="slot-highlight-header">
                  <Calendar size={15} className="slot-calendar-icon" />
                  <span className="slot-header-label">CONFIRMED APPOINTMENT SLOT</span>
                </div>
                <p className="slot-display-value">{slot.display}</p>
              </div>

              {/* Pricing Line */}
              <div className="booking-price-strip">
                <span className="price-strip-label">Diagnostic Facility Fee</span>
                <span className="price-strip-value">₦{facility.price.toLocaleString()}</span>
              </div>

              <button
                type="button"
                className="btn-change-booking-slot"
                onClick={onEditBooking}
                title="Change selected appointment slot or imaging facility"
              >
                <Calendar size={14} />
                <span>Change Facility or Slot</span>
              </button>
            </div>

            {/* Patient Information Card */}
            <div className="booking-summary-card patient-card-redesigned">
              <div className="card-section-mini-header">
                <div className="mini-icon-circle">
                  <User size={15} />
                </div>
                <div>
                  <h4 className="card-section-mini-title">Patient Demographics</h4>
                  <p className="card-section-mini-subtitle">Identity details bound to this diagnostic order</p>
                </div>
              </div>

              <div className="patient-demographics-list">
                <div className="demographic-row">
                  <span className="demo-label">Full Name</span>
                  <span className="demo-value font-semibold">{patientName}</span>
                </div>
                <div className="demographic-row">
                  <span className="demo-label">Referred By</span>
                  <span className="demo-value">{doctorName}</span>
                </div>
                <div className="demographic-row">
                  <span className="demo-label">Routing Status</span>
                  <span className="demo-value demo-badge-direct">Direct Facility Referral</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Authorization, Scan Details, Notice, and Action Strip */}
          <section className="booking-summary-col-right">
            {/* Card 1: Referring Clinician Authorization */}
            <div className="booking-summary-card clinician-auth-card-clean">
              <div className="clinician-auth-card-top">
                <div className="clinician-auth-title-group">
                  <div className="auth-shield-badge">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="auth-card-title">Referring Clinician Authorization</h3>
                    <p className="auth-card-desc">Medical Council Credentials & Digital Requisition</p>
                  </div>
                </div>
                <div className="auth-status-chip">
                  <CheckCircle2 size={13} />
                  <span>Authorized</span>
                </div>
              </div>

              <div className="clinician-meta-showcase">
                <div className="clinician-avatar-circle-lg">{doctorInitial}</div>
                <div className="clinician-text-details">
                  <div className="clinician-name-row">
                    <span className="clinician-main-name">{doctorName}</span>
                    <span className="clinician-reg-pill">MDCN Validated</span>
                  </div>
                  <span className="clinician-sub-specialty">{doctorSpecialty}</span>
                </div>
              </div>

              <div className="clinician-auth-footer-notice">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Digitally signed requisition order attached & approved for PACS facility transfer</span>
              </div>
            </div>

            {/* Card 2: Scan Clinical Specifications */}
            <div className="booking-summary-card scan-details-card-clean" id="booking-summary-scan-card">
              <div className="scan-card-top-bar">
                <div className="scan-card-title-group">
                  <div className="scan-icon-circle">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="scan-card-headline">Diagnostic Scan Specifications</h3>
                    <p className="scan-card-subheadline">Editable parameters confirmed by the referring physician</p>
                  </div>
                </div>
                <span className="scan-step-indicator">Required Parameters</span>
              </div>

              {Object.keys(scanErrors).length > 0 && (
                <div className="resq-scan-validation-alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Please fill in all required fields (Scan Type, Body Part, and Contrast) before submitting.</span>
                </div>
              )}

              <div className="scan-inputs-responsive-grid">
                {/* Scan Type */}
                <div className="scan-input-group">
                  <label className="scan-label-standard">
                    Scan Type <span className="req-asterisk">*</span>
                  </label>
                  <select
                    value={referralData.scanType || ''}
                    onChange={(e) => {
                      onUpdateReferralData({ ...referralData, scanType: e.target.value });
                      if (scanErrors.scanType) setScanErrors((prev) => ({ ...prev, scanType: '' }));
                    }}
                    className={`scan-select-standard ${scanErrors.scanType ? 'is-error' : ''}`}
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

                {/* Body Part */}
                <div className="scan-input-group">
                  <SearchableSelect
                    label="Body Part"
                    labelClassName="scan-label-standard"
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

                {/* Contrast Selection */}
                <div className="scan-input-group">
                  <label className="scan-label-standard">
                    Contrast Protocol <span className="req-asterisk">*</span>
                  </label>
                  <select
                    value={referralData.contrastOption || ''}
                    onChange={(e) => {
                      onUpdateReferralData({ ...referralData, contrastOption: e.target.value });
                      if (scanErrors.contrastOption) setScanErrors((prev) => ({ ...prev, contrastOption: '' }));
                    }}
                    className={`scan-select-standard ${scanErrors.contrastOption ? 'is-error' : ''}`}
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

              {/* Clinical Notes */}
              <div className="scan-notes-group">
                <label className="scan-label-standard">Clinical Indication & Special Instructions</label>
                <textarea
                  value={referralData.clinicalNote}
                  onChange={(e) => onUpdateReferralData({ ...referralData, clinicalNote: e.target.value })}
                  className="scan-textarea-standard"
                  rows={3}
                  placeholder="Provide pertinent clinical context, suspected diagnoses, or patient precautions..."
                />
              </div>
            </div>

            {/* Card 3: Facility Clearance Pre-Authorization Notice */}
            <div className="booking-clearance-notice-card">
              <div className="notice-icon-box">
                <AlertTriangle size={18} className="notice-icon" />
              </div>
              <div className="notice-text-content">
                <h4 className="notice-title">Diagnostic Center Appointment Clearance</h4>
                <p className="notice-desc">
                  The clinic reviews your selected slot to verify machine availability before billing. You will receive an instant notification as soon as the appointment is confirmed.
                </p>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="booking-summary-action-panel">
              <div className="action-fee-breakdown">
                <span className="action-fee-caption">Total Diagnostic Fee:</span>
                <span className="action-fee-amount">₦{facility.price.toLocaleString()}</span>
              </div>

              <button
                type="button"
                className="btn-submit-booking-order"
                onClick={handleSubmit}
                title="Submit referral order and dispatch to selected imaging center"
              >
                <CheckCircle2 size={16} />
                <span>Submit Referral & Confirm Booking</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
