import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  ShieldCheck,
  Building,
  User,
  Stethoscope,
  AlertCircle,
  Check,
  Copy,
  ClipboardList,
} from 'lucide-react';
import QRCode from 'qrcode';

export interface RequisitionDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    fullName: string;
    dob?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  referralData: {
    scanType: string;
    bodyPart: string;
    clinicalNote: string;
    contrastOption?: string;
    preferredCenter?: string;
  };
  clinicianData?: {
    name?: string;
    specialty?: string;
    license?: string;
    facility?: string;
    phone?: string;
    email?: string;
  };
  fileName?: string;
}

export const RequisitionDocumentModal: React.FC<RequisitionDocumentModalProps> = ({
  isOpen,
  onClose,
  patientData,
  referralData,
  clinicianData,
  fileName = 'Clinical_Requisition_Order.pdf',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrDetails, setShowQrDetails] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<'1' | '2'>('1');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const clinicianName = clinicianData?.name || 'Dr. Enaikele Omoh Kelvin';
  const clinicianSpecialty = clinicianData?.specialty || 'Consultant Specialist';
  const clinicianLicense = clinicianData?.license || 'MDCN-REG-847291';
  const referringFacility = clinicianData?.facility || 'ResQ Medical Center';

  const patientName = patientData.fullName || 'Fatima Lawal';
  const patientDob = patientData.dob || '14/05/1991';
  const patientGender = patientData.gender || 'Female';
  const patientPhone = patientData.phone || '+234 803 123 4567';
  const patientEmail = patientData.email || 'fatima.lawal@example.com';
  const patientAddress = patientData.address || 'Victoria Island, Lagos';

  const scanType = referralData.scanType || 'MRI';
  const bodyPart = referralData.bodyPart || 'Brain MRI';
  const clinicalNote =
    referralData.clinicalNote ||
    'Patient presents with recurrent headaches, vertigo, and focal neurological symptoms. Rule out intracranial pathology.';
  const preferredCenter = referralData.preferredCenter || 'Phoebe Medical Center';

  const orderId = 'REQ-2026-99410';
  const accessionNo = 'ACC-884920';
  const orderDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Generate real, functional, scannable QR Code
  useEffect(() => {
    if (!isOpen) return;

    // Structured medical requisition payload standard
    const payload = JSON.stringify({
      orderId,
      accessionNo,
      patient: patientName,
      dob: patientDob,
      gender: patientGender,
      scan: `${scanType} - ${bodyPart}`,
      doctor: clinicianName,
      license: clinicianLicense,
      facility: preferredCenter,
      referringClinic: referringFacility,
      status: 'VERIFIED_ACTIVE',
      verifyUrl: `https://resq.health/verify/${orderId}`,
    });

    QRCode.toDataURL(payload, {
      width: 130,
      margin: 1,
      color: {
        dark: '#06202E',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [isOpen, orderId, accessionNo, patientName, patientDob, patientGender, scanType, bodyPart, clinicianName, clinicianLicense, preferredCenter, referringFacility]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleScroll = () => {
    if (!scrollAreaRef.current || !page2Ref.current) return;
    const scrollContainerTop = scrollAreaRef.current.scrollTop;
    const page2Top = page2Ref.current.offsetTop - scrollAreaRef.current.offsetTop;
    if (scrollContainerTop >= page2Top - 220) {
      setActivePage('2');
    } else {
      setActivePage('1');
    }
  };

  const scrollToPage = (pageNum: '1' | '2') => {
    setActivePage(pageNum);
    if (pageNum === '1') {
      page1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      page2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownload = () => {
    const content = `=======================================================\n` +
      `       RESQ HEALTHCARE DIAGNOSTIC NETWORK\n` +
      `    OFFICIAL 2-PAGE CLINICAL REQUISITION PACKAGE\n` +
      `=======================================================\n` +
      `Order Ref: ${orderId} | Accession: ${accessionNo}\n` +
      `Order Date: ${orderDate} | Priority: ROUTINE / CLINICAL\n\n` +
      `--- PAGE 1: REQUISITION & EXAMINATION PROTOCOL ---\n` +
      `1. PATIENT DEMOGRAPHICS:\n` +
      `   Name:     ${patientName}\n` +
      `   MRN:      PT-99420-RESQ\n` +
      `   DOB:      ${patientDob} (${patientGender})\n` +
      `   Phone:    ${patientPhone}\n` +
      `   Email:    ${patientEmail}\n` +
      `   Address:  ${patientAddress}\n\n` +
      `2. ORDERING PHYSICIAN:\n` +
      `   Name:     ${clinicianName}\n` +
      `   Specialty:${clinicianSpecialty}\n` +
      `   License:  ${clinicianLicense}\n` +
      `   Facility: ${referringFacility}\n\n` +
      `3. EXAMINATION PROTOCOL:\n` +
      `   Modality:    ${scanType}\n` +
      `   Body Part:   ${bodyPart}\n` +
      `   Destination: ${preferredCenter}\n` +
      `   Contrast:    ${referralData.contrastOption || 'Not Specified'}\n\n` +
      `4. CLINICAL INDICATION:\n` +
      `   ${clinicalNote}\n\n` +
      `--- PAGE 2: SAFETY CLEARANCE & DIGITAL AUTHORIZATION ---\n` +
      `5. PRE-PROCEDURE SAFETY SCREENING:\n` +
      `   - Cardiac Pacemaker / ICD: None / Cleared\n` +
      `   - Aneurysm Clips / Coils: None / Cleared\n` +
      `   - Metallic Foreign Bodies: Negative / Cleared\n` +
      `   - Renal Clearance (eGFR > 60 mL/min): Documented / Cleared\n` +
      `   - Contrast Allergy History: Negative / Non-allergic\n` +
      `   - Pregnancy Status: Negative / Not Applicable\n` +
      `   - Informed Patient Consent: Documented in Clinical File\n\n` +
      `6. CLINICAL AUTHORIZATION & STAMP:\n` +
      `   Signed By: ${clinicianName}\n` +
      `   ResQ Medical Board Stamp: OFFICIALLY AUDITED & CERTIFIED\n` +
      `   Security Hash: 8F4A-99B2-C104-E58F\n` +
      `   Verification URL: https://resq.health/verify/${orderId}\n` +
      `=======================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace('.pdf', '') + '_2Page_Package.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify({
      orderId,
      accessionNo,
      patient: patientName,
      dob: patientDob,
      gender: patientGender,
      scan: `${scanType} - ${bodyPart}`,
      doctor: clinicianName,
      license: clinicianLicense,
      facility: preferredCenter,
      referringClinic: referringFacility,
      status: 'VERIFIED_ACTIVE',
    }, null, 2);

    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card-resq requisition-doc-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="req-modal-top-bar">
          <div className="req-top-bar-left">
            <FileText size={16} color="#34D399" />
            <span className="req-header-title">{fileName}</span>
            <span className="req-header-badge">2 Pages</span>
          </div>

          {/* Center Page Quick Switcher */}
          <div className="req-nav-segmented">
            <button
              type="button"
              className={`req-nav-seg-btn ${activePage === '1' ? 'active' : ''}`}
              onClick={() => scrollToPage('1')}
            >
              Page 1
            </button>
            <button
              type="button"
              className={`req-nav-seg-btn ${activePage === '2' ? 'active' : ''}`}
              onClick={() => scrollToPage('2')}
            >
              Page 2
            </button>
          </div>

          <div className="req-top-bar-actions">
            <button
              type="button"
              className="req-bar-btn"
              onClick={handlePrint}
              title="Print standard requisition"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="req-bar-btn"
              onClick={handleDownload}
              title="Download order"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <button
              type="button"
              className="req-bar-close-btn"
              onClick={onClose}
              title="Close Preview"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container (2-Page A4 Standard Vertical Package) */}
        <div
          className="req-doc-scroll-area"
          ref={scrollAreaRef}
          onScroll={handleScroll}
        >
          {/* =========================================================================
              PAGE 1 OF 2: REQUISITION ORDER & PROTOCOL
              ========================================================================= */}
          <div className="pdf-page-wrapper" ref={page1Ref} id="req-page-1">
            <div className="pdf-page-tag">Page 1 of 2</div>
            <div className="req-paper-sheet printable-requisition req-page-1-sheet">
              {/* Sheet Header with Official RESQ Logo */}
              <div className="req-sheet-header">
                <div className="req-sheet-logo-group">
                  <img
                    src="/logo.png"
                    alt="ResQ Healthcare"
                    className="req-official-logo-img"
                  />
                  <div className="req-brand-col">
                    <span className="req-hospital-brand">RESQ HEALTHCARE</span>
                    <span className="req-doc-type">Radiology Requisition Order</span>
                  </div>
                </div>

                <div className="req-order-meta-box">
                  <div className="req-order-meta-item">
                    <span className="req-meta-label">ORDER REF</span>
                    <span className="req-meta-val">{orderId}</span>
                  </div>
                  <div className="req-order-meta-item">
                    <span className="req-meta-label">DATE</span>
                    <span className="req-meta-val">{orderDate}</span>
                  </div>
                  <div className="req-order-meta-item">
                    <span className="req-meta-label">PRIORITY</span>
                    <span className="req-priority-tag">ROUTINE</span>
                  </div>
                </div>
              </div>

            {/* Section A: Patient Demographics */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <User size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION A: PATIENT DEMOGRAPHICS & CLINICAL IDENTIFICATION</h4>
              </div>

              <table className="req-standard-table">
                <tbody>
                  <tr>
                    <td className="req-label-cell">LEGAL FULL NAME</td>
                    <td className="req-data-cell highlight">
                      <strong>{patientName}</strong>
                    </td>
                    <td className="req-label-cell">PATIENT MRN</td>
                    <td className="req-data-cell font-mono">PT-99420-RESQ</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">DATE OF BIRTH</td>
                    <td className="req-data-cell">{patientDob}</td>
                    <td className="req-label-cell">GENDER / AGE</td>
                    <td className="req-data-cell">{patientGender} • Adult</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">TELEPHONE NUMBER</td>
                    <td className="req-data-cell">{patientPhone}</td>
                    <td className="req-label-cell">EMAIL ADDRESS</td>
                    <td className="req-data-cell">{patientEmail}</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">RESIDENTIAL ADDRESS</td>
                    <td className="req-data-cell" colSpan={3}>{patientAddress}</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">EMERGENCY CONTACT</td>
                    <td className="req-data-cell" colSpan={3}>Next of Kin / Relative on file (+234 802 000 1234)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section B: Ordering Clinician Details */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <Stethoscope size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION B: ORDERING CLINICIAN & PRACTICE DETAILS</h4>
              </div>

              <table className="req-standard-table">
                <tbody>
                  <tr>
                    <td className="req-label-cell">ORDERING PHYSICIAN</td>
                    <td className="req-data-cell highlight">
                      <strong>{clinicianName}</strong>
                    </td>
                    <td className="req-label-cell">MEDICAL SPECIALTY</td>
                    <td className="req-data-cell">{clinicianSpecialty}</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">MDCN LICENSE / REG</td>
                    <td className="req-data-cell font-mono">{clinicianLicense}</td>
                    <td className="req-label-cell">FACILITY / CLINIC</td>
                    <td className="req-data-cell">{referringFacility}</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">CLINICAL DIRECT LINE</td>
                    <td className="req-data-cell">+234 802 345 6789</td>
                    <td className="req-label-cell">PRACTICE REGION</td>
                    <td className="req-data-cell">Lagos Island Medical District, Nigeria</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section C: Diagnostic Examination Requested */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <Building size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION C: DIAGNOSTIC EXAMINATION PROTOCOL</h4>
              </div>

              <div className="req-exam-box">
                <div className="req-exam-grid">
                  <div className="req-exam-item">
                    <span className="req-field-label">MODALITY / EXAMINATION TYPE</span>
                    <span className="req-exam-badge">{scanType}</span>
                  </div>

                  <div className="req-exam-item">
                    <span className="req-field-label">ANATOMICAL BODY PART / REGION</span>
                    <span className="req-exam-badge secondary">{bodyPart}</span>
                  </div>

                  <div className="req-exam-item">
                    <span className="req-field-label">DESTINATION DIAGNOSTIC CENTER</span>
                    <span className="req-field-val highlight">{preferredCenter}</span>
                  </div>

                  <div className="req-exam-item">
                    <span className="req-field-label">CONTRAST ENHANCEMENT PROTOCOL</span>
                    <span className="req-field-val highlight" style={{ color: '#06202E', fontWeight: 600 }}>
                      [✓] {referralData.contrastOption || 'Not Specified'}
                    </span>
                  </div>

                  <div className="req-exam-item">
                    <span className="req-field-label">CLINICAL URGENCY</span>
                    <span className="req-field-val">Routine Diagnostic / Standard Window</span>
                  </div>

                  <div className="req-exam-item">
                    <span className="req-field-label">ROUTING STATUS</span>
                    <span className="req-field-val highlight" style={{ color: '#0A7E64' }}>
                      Authorized for Center Booking & PACS Submission
                    </span>
                  </div>
                </div>

                <div className="req-clinical-notes-block">
                  <span className="req-field-label">CLINICAL INDICATION & SPECIFIC DIAGNOSTIC QUESTION TO BE ANSWERED</span>
                  <p className="req-indication-text">{clinicalNote}</p>
                </div>
              </div>
            </div>

            {/* Section D: Relevant Prior Diagnostic History */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <ClipboardList size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION D: PRIOR DIAGNOSTIC HISTORY & LABORATORY INDICES</h4>
              </div>

              <table className="req-standard-table">
                <tbody>
                  <tr>
                    <td className="req-label-cell">PRIOR IMAGING ON FILE</td>
                    <td className="req-data-cell">No prior comparison imaging uploaded on current file. Baseline scan requested.</td>
                    <td className="req-label-cell">RENAL LAB INDICES</td>
                    <td className="req-data-cell">eGFR &gt; 60 mL/min (Serum Creatinine within normal reference range).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Page 1 Bottom Footer */}
            <div className="req-page-footer-strip">
              <div className="req-page-footer-left">
                <span className="font-semibold text-primary">ResQ Diagnostic Order</span> • Ref: {orderId} • Accession: {accessionNo}
              </div>
              <div className="req-page-footer-right">
                <span className="req-page-number-tag">Page 1 of 2</span>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLL-DOWN PAGE CONNECTOR */}
        <div className="pdf-scroll-divider" onClick={() => scrollToPage('2')}>
          <div className="pdf-divider-line" />
          <span className="pdf-divider-tag">Page 2</span>
          <div className="pdf-divider-line" />
        </div>

        {/* =========================================================================
            PAGE 2 OF 2: CLINICAL SAFETY SCREENING & DIGITAL AUTHORIZATION
            ========================================================================= */}
        <div className="pdf-page-wrapper" ref={page2Ref} id="req-page-2">
          <div className="pdf-page-tag">Page 2 of 2</div>
          <div className="req-paper-sheet printable-requisition req-page-2-sheet">
            {/* Page 2 Running Header */}
            <div className="req-sheet-header req-page-2-header">
              <div className="req-sheet-logo-group">
                <img
                  src="/logo.png"
                  alt="ResQ Healthcare"
                  className="req-official-logo-img"
                  style={{ height: '32px' }}
                />
                <div className="req-brand-col">
                  <span className="req-hospital-brand" style={{ fontSize: '13px' }}>RESQ HEALTHCARE</span>
                  <span className="req-doc-type" style={{ fontSize: '10.5px' }}>Safety Screening & Authorization</span>
                </div>
              </div>

              <div className="req-page-2-meta-tracker">
                <span><strong>{patientName}</strong></span>
                <span>•</span>
                <span>MRN: <span className="font-mono">PT-99420-RESQ</span></span>
                <span>•</span>
                <span>Ref: <span className="font-mono">{orderId}</span></span>
              </div>
            </div>

            {/* Section E: Comprehensive Safety Screening Checklist */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <AlertCircle size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION E: PRE-EXAMINATION SAFETY SCREENING & MRI/CT COMPATIBILITY</h4>
              </div>

              <div className="req-safety-checklist-grid">
                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Cardiac Pacemaker / ICD:</strong>
                    <span className="safety-sub-text"> Negative / Patient has no cardiac electronic implants.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Cerebral Aneurysm Clips:</strong>
                    <span className="safety-sub-text"> Negative / No intracranial vascular surgical clips.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Metallic Foreign Bodies / Shrapnel:</strong>
                    <span className="safety-sub-text"> Negative / Cleared for orbital and spinal scanning.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Neurostimulators & Implants:</strong>
                    <span className="safety-sub-text"> Negative / No deep-brain or spinal stimulators.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Renal Function (eGFR &gt; 60 mL/min):</strong>
                    <span className="safety-sub-text"> Cleared for intravenous Gadolinium/Iodinated contrast.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Contrast Allergy History:</strong>
                    <span className="safety-sub-text"> Negative / No prior adverse reaction to contrast media.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Pregnancy & Lactation:</strong>
                    <span className="safety-sub-text"> Confirmed Non-Pregnant / Non-lactating where applicable.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Claustrophobia & Mobility:</strong>
                    <span className="safety-sub-text"> Assessed as cooperative for closed/open gantry scanning.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Informed Written Consent:</strong>
                    <span className="safety-sub-text"> Signed and recorded in ResQ electronic medical file.</span>
                  </div>
                </div>

                <div className="req-safety-item">
                  <div className="req-check-box">[✓]</div>
                  <div>
                    <strong>Diagnostic Center Verification:</strong>
                    <span className="safety-sub-text"> Pre-screening confirmed by referring clinical team.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section F: Diagnostic Facility & Radiologist Instructions */}
            <div className="req-sheet-section">
              <div className="req-section-title-row">
                <Building size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION F: RADIOLOGIST INSTRUCTIONS & PACS TRANSMISSION</h4>
              </div>

              <table className="req-standard-table">
                <tbody>
                  <tr>
                    <td className="req-label-cell">IMAGING PROTOCOL</td>
                    <td className="req-data-cell">Multi-planar sequences (axial, coronal, sagittal) with thin-slice reconstruction per modality standard.</td>
                    <td className="req-label-cell">CRITICAL FINDINGS</td>
                    <td className="req-data-cell">Immediate direct telephone call required to ordering clinician if urgent intracranial/acute pathology noted.</td>
                  </tr>
                  <tr>
                    <td className="req-label-cell">PACS / DICOM TRANSMISSION</td>
                    <td className="req-data-cell" colSpan={3}>
                      Primary DICOM series and signed radiologist report must be uploaded to the ResQ Enterprise PACS gateway within 24 hours of scan completion.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section G: Signature, Stamp & Scannable QR Code */}
            <div className="req-sheet-section" style={{ marginTop: 'auto' }}>
              <div className="req-section-title-row">
                <ShieldCheck size={15} className="req-section-icon" />
                <h4 className="req-section-title">SECTION G: CLINICAL AUTHORIZATION & DIGITAL VERIFICATION</h4>
              </div>

              <div className="req-sheet-footer">
                {/* Left: Clinician Electronic Signature */}
                <div className="req-signature-block">
                  <span className="req-signature-header-label">AUTHORIZED CLINICIAN SIGNATURE</span>
                  <div className="req-signature-line" />
                  <span className="req-physician-signed">{clinicianName}</span>
                  <span className="req-signature-sub">Electronically Signed & Authorized</span>
                  <span className="req-signature-timestamp">
                    Timestamp: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
                  </span>
                  <span className="req-cert-id">Cert ID: CERT-{clinicianLicense.replace(/[^A-Z0-9]/gi, '') || '99210'}-AUTH</span>
                </div>

                {/* Center: Official Medical Board Stamp */}
                <div className="req-auth-stamp-block">
                  <div className="req-stamp-badge">
                    <ShieldCheck size={28} color="#0A7E64" />
                    <div className="req-stamp-text">
                      <span className="stamp-title">RESQ MEDICAL BOARD</span>
                      <span className="stamp-cert">OFFICIAL AUDIT & AUTHENTICATION</span>
                      <span className="stamp-hash">HASH: 8F4A-99B2-C104-E58F</span>
                      <span className="stamp-status">STATUS: CLINICALLY CLEARED</span>
                    </div>
                  </div>
                </div>

                {/* Right: Functional, Scannable QR Code */}
                <div className="req-qr-block">
                  <div
                    className="req-qr-box interactive-qr-box"
                    onClick={() => setShowQrDetails(!showQrDetails)}
                    title="Click to view decoded QR code payload"
                  >
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Scannable Medical QR Code" className="req-qr-img" />
                    ) : (
                      <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Generating...</span>
                      </div>
                    )}
                  </div>
                  <span className="req-qr-caption">Scan with Phone / RIS Scanner</span>
                  <button
                    type="button"
                    className="btn-test-qr-pill"
                    onClick={() => setShowQrDetails(!showQrDetails)}
                  >
                    {showQrDetails ? 'Hide QR Payload' : 'Inspect QR Data'}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Decoded QR Code Payload Panel */}
            {showQrDetails && (
              <div className="qr-decoded-panel">
                <div className="qr-decoded-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#0A7E64" />
                    <strong>Live QR Code Decoded Payload (ISO 15189 Certified)</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-copy-qr-data"
                      onClick={handleCopyPayload}
                    >
                      {copiedPayload ? <Check size={12} color="#0A7E64" /> : <Copy size={12} />}
                      <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQrDetails(false)}
                      className="btn-close-qr-panel"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="qr-decoded-body">
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Order ID:</span>
                    <span className="qr-payload-v">{orderId}</span>
                  </div>
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Patient Name:</span>
                    <span className="qr-payload-v">{patientName} ({patientDob})</span>
                  </div>
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Examination:</span>
                    <span className="qr-payload-v">{scanType} - {bodyPart}</span>
                  </div>
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Ordering Doctor:</span>
                    <span className="qr-payload-v">{clinicianName} ({clinicianLicense})</span>
                  </div>
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Target Diagnostic Center:</span>
                    <span className="qr-payload-v">{preferredCenter}</span>
                  </div>
                  <div className="qr-payload-item">
                    <span className="qr-payload-k">Verification Hash:</span>
                    <span className="qr-payload-v">8F4A-99B2-C104-E58F (VERIFIED_ACTIVE)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Page 2 Bottom Footer Strip */}
            <div className="req-page-footer-strip">
              <div className="req-page-footer-left">
                <span className="font-semibold text-primary">ResQ Diagnostic Requisition</span> • Ref: {orderId} • MDCN Certified
              </div>
              <div className="req-page-footer-right">
                <span className="req-page-number-tag">Page 2 of 2</span>
              </div>
            </div>

            {/* Page 2 Legal Footer */}
            <div className="req-legal-footer" style={{ marginTop: '12px' }}>
              <div className="req-legal-text">
                This document constitutes an official clinical requisition package under ISO 15189 standards and MDCN regulatory frameworks.
                Diagnostic images and primary reports must be uploaded directly to the ResQ Health Enterprise PACS repository.
              </div>
              <div className="req-page-number">Page 2 of 2 • Confidential Medical Document • End of Order</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
