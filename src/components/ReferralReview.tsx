import React, { useState } from 'react';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Users,
  Layers,
  CheckCircle2,
  Edit3,
  Store,
  Eye,
  UserCheck,
} from 'lucide-react';
import { SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import { SearchableSelect } from './SearchableSelect';
import { RequisitionDocumentModal } from './RequisitionDocumentModal';

interface ReferralReviewProps {
  formData: {
    fullName: string;
    email: string;
    gender: string;
    phone: string;
    dob: string;
    address: string;
    scanType: string;
    bodyPart: string;
    contrastOption?: string;
    clinicalNote: string;
    preferredCenter?: string;
  };
  user?: {
    email?: string;
    fullname?: string;
    specialty?: string;
    licenseNumber?: string;
    practiceName?: string;
    phoneNumber?: string;
  };
  uploadedFileName?: string;
  onEditPersonalInfo: () => void;
  onEditScanDetails: () => void;
  onProceed: () => void;
  onUpdateFormData?: (updated: Partial<ReferralReviewProps['formData']>) => void;
  onProceedToBooking?: () => void;
  onBackToDashboard?: () => void;
}

export const ReferralReview: React.FC<ReferralReviewProps> = ({
  formData,
  user,
  uploadedFileName,
  onEditPersonalInfo,
  onEditScanDetails,
  onProceed,
  onUpdateFormData,
  onProceedToBooking,
  onBackToDashboard,
}) => {
  const fullName = formData.fullName || 'Alexia Olamide Adeyemi';
  const email = formData.email || 'alexia.adeyemi@healthmail.com';
  const gender = formData.gender || 'Female';
  const phone = formData.phone || '0801 234 5678';
  const dob = formData.dob || '14/08/1992';
  const address = formData.address || 'Victoria Island, Lagos';

  const rawDoctorName = user?.fullname?.trim() || 'Enaikele Omoh Kelvin';
  const clinicianName = rawDoctorName.toLowerCase().startsWith('dr.')
    ? rawDoctorName
    : `Dr. ${rawDoctorName}`;
  const clinicianSpecialty = user?.specialty?.trim() || 'Consultant Specialist';
  const clinicianLicense = user?.licenseNumber?.trim() || 'MDCN-REG-847291';
  const clinicianFacility = user?.practiceName?.trim() || 'ResQ Medical Center';
  const doctorInitial = (rawDoctorName.toLowerCase().startsWith('dr.')
    ? rawDoctorName.substring(3).trim()
    : rawDoctorName
  ).charAt(0).toUpperCase() || 'E';

  const scanType = formData.scanType || 'MRI';
  const bodyPart = formData.bodyPart || 'Brain MRI';
  const clinicalNote =
    formData.clinicalNote ||
    'Patient presents with recurrent headaches, vertigo, and focal neurological symptoms. Rule out intracranial pathology.';
  const documentName = uploadedFileName || 'Clinical_Requisition_Order.pdf';
  const [isPreviewDocOpen, setIsPreviewDocOpen] = useState(false);

  return (
    <div className="referral-review-layout">
      {/* Redesigned Executive Top Header */}
      <header className="marketplace-navbar">
        <div className="marketplace-nav-left">
          <button
            type="button"
            onClick={onBackToDashboard || onEditScanDetails}
            className="btn-back-clean"
            title="Exit to Referrals Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className="marketplace-brand-wrap"
            onClick={onBackToDashboard}
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
              className="market-nav-step-pill active"
            >
              <span className="step-pill-number">1</span>
              <span className="step-pill-text">Referral Summary</span>
            </button>
            <div className="market-stepper-line" />
            <button
              type="button"
              className="market-nav-step-pill"
              onClick={onProceedToBooking || onProceed}
              title="Proceed to Provider Selection"
            >
              <span className="step-pill-number">2</span>
              <span className="step-pill-text">Select Provider</span>
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
                <span className="doctor-pill-name">{clinicianName}</span>
                <span className="doctor-verified-dot" title="Authenticated Clinician" />
              </div>
              <span className="doctor-pill-specialty">{clinicianSpecialty}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="referral-page-summary-wrapper" style={{ maxWidth: '860px', margin: '24px auto' }}>
        {/* Executive Header Banner */}
        <div className="referral-summary-header-banner">
          <div className="summary-banner-top-row">
            <button
              type="button"
              className="modal-nav-back-pill"
              onClick={onEditScanDetails}
              title="Return to Step 2: Scan Details"
            >
              <ArrowLeft size={13} />
              <span>Back to Scan Details</span>
            </button>

            <div className="summary-status-pill">
              <CheckCircle2 size={13} className="text-emerald" />
              <span>Review & Clinical Verification</span>
            </div>
          </div>

          <div className="summary-banner-title-block">
            <h1 className="referral-page-summary-title">Referral Summary & Clinical Review</h1>
            <p className="referral-page-summary-subtitle">
              Verify all clinical parameters before routing to an accredited imaging center or issuing patient self-scheduling.
            </p>
          </div>
        </div>

      {/* 1. PERSONAL INFORMATION SECTION */}
      <div className="referral-summary-card-executive">
        <div className="referral-card-section-header">
          <div className="section-header-title-group">
            <div className="section-icon-badge">
              <Users size={16} />
            </div>
            <div>
              <h3 className="referral-card-section-label">Patient Demographics</h3>
              <p className="referral-card-section-desc">Patient identity details for diagnostic center registration.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-review-edit-info"
            onClick={onEditPersonalInfo}
            title="Edit in modal"
          >
            <Edit3 size={12} />
            <span>Edit in Step 1</span>
          </button>
        </div>

        <div className="referral-card-inputs-grid">
          <div className="referral-input-unit">
            <label className="referral-unit-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => onUpdateFormData?.({ fullName: e.target.value })}
              className="referral-unit-input"
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onUpdateFormData?.({ email: e.target.value })}
              className="referral-unit-input"
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Gender</label>
            <select
              value={gender}
              onChange={(e) => onUpdateFormData?.({ gender: e.target.value })}
              className="referral-unit-input"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onUpdateFormData?.({ phone: e.target.value })}
              className="referral-unit-input"
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Date of Birth</label>
            <input
              type="text"
              value={dob}
              onChange={(e) => onUpdateFormData?.({ dob: e.target.value })}
              className="referral-unit-input"
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => onUpdateFormData?.({ address: e.target.value })}
              className="referral-unit-input"
            />
          </div>
        </div>
      </div>

      {/* 2. ORDERING CLINICIAN SECTION */}
      <div className="referral-summary-card-executive">
        <div className="referral-card-section-header">
          <div className="section-header-title-group">
            <div className="section-icon-badge">
              <UserCheck size={16} />
            </div>
            <div>
              <h3 className="referral-card-section-label">Ordering Clinician & Facility</h3>
              <p className="referral-card-section-desc">Authenticated physician details on file for medical requisition authorization.</p>
            </div>
          </div>
          <span className="summary-status-pill" style={{ margin: 0 }}>
            <CheckCircle2 size={13} className="text-emerald" />
            <span>MDCN Authorized</span>
          </span>
        </div>

        <div className="referral-card-inputs-grid">
          <div className="referral-input-unit">
            <label className="referral-unit-label">Doctor Name</label>
            <input
              type="text"
              readOnly
              value={clinicianName}
              className="referral-unit-input"
              style={{ backgroundColor: '#F8FAFC', fontWeight: 600, color: '#06202E' }}
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Clinical Specialty</label>
            <input
              type="text"
              readOnly
              value={clinicianSpecialty}
              className="referral-unit-input"
              style={{ backgroundColor: '#F8FAFC', color: '#334155' }}
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">MDCN License Number</label>
            <input
              type="text"
              readOnly
              value={clinicianLicense}
              className="referral-unit-input font-mono"
              style={{ backgroundColor: '#F8FAFC', color: '#334155' }}
            />
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Referring Medical Facility</label>
            <input
              type="text"
              readOnly
              value={clinicianFacility}
              className="referral-unit-input"
              style={{ backgroundColor: '#F8FAFC', color: '#334155' }}
            />
          </div>
        </div>
      </div>

      {/* 3. SCAN DETAILS SECTION */}
      <div className="referral-summary-card-executive">
        <div className="referral-card-section-header">
          <div className="section-header-title-group">
            <div className="section-icon-badge">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="referral-card-section-label">Diagnostic Scan Protocol</h3>
              <p className="referral-card-section-desc">Select imaging modality and anatomical region using the dropdowns.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-review-edit-info"
            onClick={onEditScanDetails}
            title="Edit in modal"
          >
            <Edit3 size={12} />
            <span>Edit in Step 2</span>
          </button>
        </div>

        <div className="referral-card-inputs-grid">
          {/* Scan Type DROPDOWN */}
          <div className="referral-input-unit">
            <label className="referral-unit-label">Scan Type (Dropdown)</label>
            <select
              value={scanType}
              onChange={(e) => onUpdateFormData?.({ scanType: e.target.value })}
              className="referral-unit-input referral-unit-select"
            >
              {SCAN_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Body Part SEARCHABLE DROPDOWN */}
          <div className="referral-input-unit">
            <SearchableSelect
              label="Body Part (Dropdown)"
              labelClassName="referral-unit-label"
              options={BODY_PARTS}
              value={bodyPart}
              onChange={(val) => onUpdateFormData?.({ bodyPart: val })}
              placeholder="Search body part..."
            />
          </div>

          {/* Contrast Selection DROPDOWN */}
          <div className="referral-input-unit">
            <label className="referral-unit-label">Contrast Protocol</label>
            <select
              value={formData.contrastOption || 'Not Specified'}
              onChange={(e) => onUpdateFormData?.({ contrastOption: e.target.value })}
              className="referral-unit-input referral-unit-select"
            >
              {CONTRAST_OPTIONS.map((co) => (
                <option key={co} value={co}>
                  {co}
                </option>
              ))}
            </select>
          </div>

          <div className="referral-input-unit">
            <label className="referral-unit-label">Estimated Price Range</label>
            <input
              type="text"
              defaultValue="₦70,000.00 - ₦95,000.00"
              className="referral-unit-input"
            />
          </div>
        </div>

        <div className="referral-input-unit" style={{ marginTop: '16px' }}>
          <label className="referral-unit-label">Clinical Indication & Notes</label>
          <textarea
            value={clinicalNote}
            onChange={(e) => onUpdateFormData?.({ clinicalNote: e.target.value })}
            className="referral-unit-textarea"
            rows={3}
          />
        </div>

        <div className="referral-input-unit" style={{ marginTop: '16px' }}>
          <label className="referral-unit-label">Attached Document</label>
          <div
            className="review-document-pill-executive interactive-doc-pill"
            onClick={() => setIsPreviewDocOpen(true)}
            title={`Click to view and preview ${documentName}`}
          >
            <div className="doc-pill-left">
              <FileText size={18} className="review-doc-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="review-doc-name">{documentName}</span>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>1.2 MB • Digitally Signed Requisition</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="doc-verified-badge">Digital PDF</span>
              <span className="btn-preview-doc-chip">
                <Eye size={12} />
                <span>View Document</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Actions */}
      <div className="referral-summary-book-row" style={{ marginTop: '24px' }}>
        <button
          type="button"
          className="btn-resq-back"
          onClick={onEditScanDetails}
        >
          <ArrowLeft size={15} />
          <span>Back to Scan Details</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-resq-back"
            onClick={onProceed}
            title="Proceed to Step 3: Scan Location"
          >
            <span>Configure Routing (Step 3)</span>
          </button>

          <button
            type="button"
            className="btn-proceed-to-book-resq"
            onClick={() => {
              if (onProceedToBooking) {
                onProceedToBooking();
              } else {
                onProceed();
              }
            }}
            title="Select facility from marketplace"
          >
            <Store size={15} />
            <span>Proceed to Book (Select Facility)</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Requisition Order Document Preview Modal */}
      <RequisitionDocumentModal
        isOpen={isPreviewDocOpen}
        onClose={() => setIsPreviewDocOpen(false)}
        patientData={{
          fullName,
          email,
          gender,
          phone,
          dob,
          address,
        }}
        referralData={{
          scanType,
          bodyPart,
          clinicalNote,
          contrastOption: formData.contrastOption || 'Not Specified',
          preferredCenter: formData.preferredCenter || 'Phoebe Medical Center',
        }}
        clinicianData={{
          name: clinicianName,
          specialty: clinicianSpecialty,
          license: clinicianLicense,
          facility: clinicianFacility,
        }}
        fileName={documentName}
      />
      </div>
    </div>
  );
};
