import React, { useState } from 'react';
import { Check, Copy, CheckCheck, ArrowRight } from 'lucide-react';

interface ReferralSuccessProps {
  referral: {
    id: string;
    patientName: string;
    scanType: string;
    bodyPart?: string;
    facilityName: string;
    status: string;
    referralLink: string;
  };
  onViewReferrals: () => void;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
}

export const ReferralSuccess: React.FC<ReferralSuccessProps> = ({
  referral,
  onViewReferrals,
  onAddToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referral.referralLink);
    }
    setCopied(true);
    if (onAddToast) {
      onAddToast('success', 'Copied!', 'Referral link copied to clipboard.');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="referral-success-wrapper">
      {/* Green Checkmark Circle */}
      <div className="success-icon-circle">
        <Check size={28} className="success-check-svg" />
      </div>

      <h2 className="success-heading">Referral submitted successfully</h2>
      <p className="success-subheading">
        The referral details have been saved and notifications sent.
      </p>

      {/* Details Box */}
      <div className="success-details-card">
        <div className="details-grid-2col">
          <div className="details-col">
            <span className="details-label">Referral ID</span>
            <span className="details-value-id">{referral.id}</span>
          </div>

          <div className="details-col">
            <span className="details-label">Patient</span>
            <span className="details-value-bold">{referral.patientName}</span>
          </div>

          <div className="details-col">
            <span className="details-label">Scan</span>
            <span className="details-value">{referral.scanType}{referral.bodyPart ? `-${referral.bodyPart}` : ''}</span>
          </div>

          <div className="details-col">
            <span className="details-label">Provider</span>
            <span className="details-value">{referral.facilityName}</span>
          </div>

          <div className="details-col" style={{ gridColumn: 'span 2' }}>
            <span className="details-label">Status</span>
            <span className="status-submitted-badge">
              <span className="status-dot" />
              Submitted
            </span>
          </div>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="success-link-card">
        <div className="link-info-side">
          <span className="details-label">Referral Link</span>
          <span className="referral-link-url" title={referral.referralLink}>
            {referral.referralLink}
          </span>
        </div>

        <button type="button" className="btn-copy-link" onClick={handleCopyLink}>
          {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied' : 'Copy Link'}</span>
        </button>
      </div>

      <div className="success-actions-row">
        <button
          type="button"
          className="btn-create-referral flex-center-gap"
          onClick={onViewReferrals}
        >
          <span>View Referral Lists</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
