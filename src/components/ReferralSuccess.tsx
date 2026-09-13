import React, { useState } from 'react';
import {
  Check,
  Copy,
  CheckCheck,
  ArrowRight,
  FileText,
  Calendar,
  Building2,
  User,
  ExternalLink,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Clock,
  MapPin,
  Sparkles,
  Activity,
} from 'lucide-react';

interface ReferralSuccessProps {
  referral: {
    id: string;
    patientName: string;
    scanType: string;
    bodyPart?: string;
    facilityName: string;
    status: string;
    referralLink: string;
    bookingSlot?: { date: string; time: string; display: string };
    patientEmail?: string;
    patientPhone?: string;
    patientGender?: string;
    patientDob?: string;
    urgency?: string;
    createdAt?: string;
    doctorName?: string;
    facilityAddress?: string;
    contrastOption?: string;
    clinicalNote?: string;
  };
  onViewReferrals: () => void;
  onCreateNewReferral?: () => void;
  onViewRequisition?: () => void;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
}

export const ReferralSuccess: React.FC<ReferralSuccessProps> = ({
  referral,
  onViewReferrals,
  onCreateNewReferral,
  onViewRequisition,
  onAddToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referral.referralLink);
    }
    setCopiedLink(true);
    if (onAddToast) {
      onAddToast('success', 'Copied!', 'Referral link copied to clipboard.');
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referral.id);
    }
    setCopiedId(true);
    if (onAddToast) {
      onAddToast('success', 'Copied!', `Referral ID ${referral.id} copied.`);
    }
    setTimeout(() => setCopiedId(false), 2500);
  };

  const formattedScan = `${referral.scanType || 'Diagnostic Imaging'}${
    referral.bodyPart ? ` — ${referral.bodyPart}` : ''
  }`;

  return (
    <div className="referral-success-page-container">
      {/* Top Celebration Hero */}
      <div className="success-celebration-hero">
        <div className="success-check-pulse-wrap">
          <div className="success-check-pulse-ring" />
          <div className="success-icon-badge">
            <Check size={32} strokeWidth={2.8} />
          </div>
        </div>

        <div className="success-status-pill">
          <Sparkles size={13} className="sparkle-icon" />
          <span>Clinical Requisition Confirmed</span>
        </div>

        <h1 className="success-title-main">Referral Submitted Successfully</h1>
        <p className="success-subtitle-text">
          The digital requisition order has been generated and securely routed. Notifications with
          direct access have been sent to the patient and the diagnostic center.
        </p>
      </div>

      {/* Main Clinical Receipt / Summary Card */}
      <div className="success-order-summary-card">
        {/* Card Header Bar */}
        <div className="success-card-topbar">
          <div className="success-card-order-id-group">
            <span className="order-id-label">REFERRAL ORDER ID</span>
            <div className="order-id-badge-wrap">
              <span className="order-id-code">{referral.id}</span>
              <button
                type="button"
                className="btn-id-copy"
                onClick={handleCopyId}
                title="Copy Referral ID"
                aria-label="Copy Referral ID"
              >
                {copiedId ? <CheckCheck size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="success-card-meta-right">
            <div className="success-timestamp-item">
              <Clock size={13} />
              <span>{referral.createdAt || 'Today • Immediate Dispatch'}</span>
            </div>
            <div className="status-submitted-badge">
              <span className="status-dot" />
              <span>{referral.status || 'Submitted'}</span>
            </div>
          </div>
        </div>

        {/* 3-Column Structured Information Grid */}
        <div className="success-details-grid-3col">
          {/* Column 1: Patient Information */}
          <div className="success-info-block">
            <div className="info-block-header">
              <div className="info-icon-pill icon-patient">
                <User size={15} />
              </div>
              <span className="info-block-title">PATIENT INFORMATION</span>
            </div>
            <div className="info-block-body">
              <h3 className="info-primary-name">{referral.patientName}</h3>
              <div className="info-sub-meta-list">
                {referral.patientGender && (
                  <span className="info-sub-tag">{referral.patientGender}</span>
                )}
                {referral.patientDob && (
                  <span className="info-sub-tag">DOB: {referral.patientDob}</span>
                )}
              </div>
              {referral.patientEmail && (
                <div className="info-contact-line">
                  <Mail size={13} />
                  <span>{referral.patientEmail}</span>
                </div>
              )}
              {referral.patientPhone && (
                <div className="info-contact-line">
                  <Phone size={13} />
                  <span>{referral.patientPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Scan & Examination Details */}
          <div className="success-info-block">
            <div className="info-block-header">
              <div className="info-icon-pill icon-scan">
                <Activity size={15} />
              </div>
              <span className="info-block-title">ORDERED EXAMINATION</span>
            </div>
            <div className="info-block-body">
              <h3 className="info-primary-name">{formattedScan}</h3>
              <div className="info-sub-meta-list">
                <span className="info-sub-tag tag-contrast">
                  {referral.contrastOption || 'Without Contrast'}
                </span>
                <span className="info-sub-tag tag-urgency">
                  {referral.urgency || 'Routine'} Priority
                </span>
              </div>
              {referral.clinicalNote && (
                <p className="info-clinical-notes" title={referral.clinicalNote}>
                  "{referral.clinicalNote}"
                </p>
              )}
              {referral.doctorName && (
                <div className="info-doctor-signoff">
                  <span>Authorized by:</span>
                  <strong>{referral.doctorName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Facility & Booking Slot */}
          <div className="success-info-block">
            <div className="info-block-header">
              <div className="info-icon-pill icon-facility">
                <Building2 size={15} />
              </div>
              <span className="info-block-title">FACILITY & APPOINTMENT</span>
            </div>
            <div className="info-block-body">
              <h3 className="info-primary-name">{referral.facilityName}</h3>
              {referral.bookingSlot ? (
                <div className="info-appointment-slot-pill">
                  <Calendar size={14} />
                  <span>{referral.bookingSlot.display || `${referral.bookingSlot.date} at ${referral.bookingSlot.time}`}</span>
                </div>
              ) : (
                <div className="info-appointment-slot-pill slot-pending">
                  <Clock size={14} />
                  <span>Patient Choice / Facility to Schedule</span>
                </div>
              )}
              {referral.facilityAddress && (
                <div className="info-contact-line">
                  <MapPin size={13} />
                  <span>{referral.facilityAddress}</span>
                </div>
              )}
              <div className="info-electronic-badge">
                <ShieldCheck size={13} />
                <span>Direct RIS/PACS Electronic Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Portal Link Card */}
        <div className="success-patient-link-container">
          <div className="link-banner-header">
            <div className="link-title-wrap">
              <span className="link-lead-label">Patient Access & Tracking Portal</span>
              <p className="link-description">
                Encrypted patient self-service link sent via SMS and Email to view directions,
                preparation instructions, and scan status.
              </p>
            </div>
          </div>

          <div className="link-input-action-bar">
            <div className="link-input-display-box" title={referral.referralLink}>
              <span className="link-prefix">https://</span>
              <span className="link-url-text">
                {referral.referralLink.replace(/^https?:\/\//, '')}
              </span>
            </div>

            <div className="link-actions-btns">
              <button
                type="button"
                className="btn-copy-link-primary"
                onClick={handleCopyLink}
              >
                {copiedLink ? <CheckCheck size={15} /> : <Copy size={15} />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>

              <a
                href={referral.referralLink}
                target="_blank"
                rel="noreferrer"
                className="btn-open-link-secondary"
                title="Preview Patient View in New Tab"
              >
                <ExternalLink size={15} />
                <span>Open Link</span>
              </a>
            </div>
          </div>
        </div>

        {/* Automated Dispatch Checklist Badges */}
        <div className="success-dispatch-checklist">
          <div className="dispatch-check-item">
            <span className="check-bullet">✓</span>
            <span>Digital Order Transmitted to Diagnostic Center</span>
          </div>
          <div className="dispatch-check-item">
            <span className="check-bullet">✓</span>
            <span>SMS & Email Confirmation Sent to Patient</span>
          </div>
          <div className="dispatch-check-item">
            <span className="check-bullet">✓</span>
            <span>Official Requisition PDF Generated & Verified</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="success-executive-actions-bar">
        {onViewRequisition && (
          <button
            type="button"
            className="btn-action-primary-requisition"
            onClick={onViewRequisition}
          >
            <FileText size={17} />
            <span>View / Download Requisition PDF</span>
          </button>
        )}

        <button
          type="button"
          className="btn-action-secondary-referrals"
          onClick={onViewReferrals}
        >
          <span>Return to Referrals List</span>
          <ArrowRight size={17} />
        </button>

        {onCreateNewReferral && (
          <button
            type="button"
            className="btn-action-ghost-create"
            onClick={onCreateNewReferral}
          >
            <Plus size={16} />
            <span>Create Another Referral</span>
          </button>
        )}
      </div>
    </div>
  );
};
