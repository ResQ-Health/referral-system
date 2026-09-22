import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface DiagnosticReport {
  accessionId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  patientId: string;
  modality: string;
  anatomicalRegion: string;
  facility: string;
  radiologist: string;
  radiologistTitle: string;
  examDate: string;
  finalizedDate: string;
  indication: string;
  technique: string;
  comparison: string;
  findings: string[];
  impression: string[];
  status: 'Finalized' | 'Preliminary';
  category: 'Radiology' | 'Ultrasound' | 'Pathology';
}

interface RadiologyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DiagnosticReport | null;
  referringDoctor?: string;
}

export const RadiologyReportModal: React.FC<RadiologyReportModalProps> = ({
  isOpen,
  onClose,
  report,
  referringDoctor = 'Dr. Gafey Bowlfuel, MD',
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="resq-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="resq-report-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header Bar */}
        <div className="report-modal-top-bar">
          <div className="report-top-title-group">
            <span className="report-modal-tag">Official Diagnostic Report</span>
            <h2 className="report-modal-title">Accession #{report.accessionId}</h2>
          </div>
          <div className="report-modal-actions">
            <button
              type="button"
              className="receipt-btn-action"
              onClick={handlePrint}
              title="Print Report"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              type="button"
              className="receipt-btn-action primary"
              onClick={handlePrint}
              title="Download PDF"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              className="receipt-btn-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="report-document-sheet" ref={printRef}>
          {/* Facility Header */}
          <div className="report-facility-header">
            <div className="report-facility-info">
              <h3 className="report-facility-name">{report.facility}</h3>
              <p className="report-facility-sub">Department of Radiology & Diagnostic Imaging</p>
              <p className="report-accreditation">Accredited by Radiographers Registration Board of Nigeria (RRBN)</p>
            </div>
            <div className="report-badge-col">
              <span className="report-status-badge">
                <CheckCircle2 size={13} />
                <span>{report.status.toUpperCase()}</span>
              </span>
              <span className="report-date-meta">Date: {report.finalizedDate}</span>
            </div>
          </div>

          <div className="report-divider" />

          {/* Patient and Study Demographics Grid */}
          <div className="report-meta-grid">
            <div className="report-meta-item">
              <span className="meta-label">Patient Name</span>
              <strong className="meta-val">{report.patientName}</strong>
            </div>
            <div className="report-meta-item">
              <span className="meta-label">MRN / Patient ID</span>
              <span className="meta-val">{report.patientId}</span>
            </div>
            <div className="report-meta-item">
              <span className="meta-label">DOB / Gender</span>
              <span className="meta-val">{report.patientDob} ({report.patientGender})</span>
            </div>
            <div className="report-meta-item">
              <span className="meta-label">Referring Physician</span>
              <span className="meta-val">{referringDoctor}</span>
            </div>
            <div className="report-meta-item">
              <span className="meta-label">Examination Date</span>
              <span className="meta-val">{report.examDate}</span>
            </div>
            <div className="report-meta-item">
              <span className="meta-label">Modality / Procedure</span>
              <span className="meta-val font-semibold text-teal">{report.modality}</span>
            </div>
          </div>

          {/* Section: Clinical History / Indication */}
          <div className="report-section">
            <h4 className="report-section-heading">Clinical Indication</h4>
            <p className="report-section-body">{report.indication}</p>
          </div>

          {/* Section: Technique */}
          <div className="report-section">
            <h4 className="report-section-heading">Technique</h4>
            <p className="report-section-body">{report.technique}</p>
          </div>

          {/* Section: Comparison */}
          {report.comparison && (
            <div className="report-section">
              <h4 className="report-section-heading">Comparison</h4>
              <p className="report-section-body">{report.comparison}</p>
            </div>
          )}

          {/* Section: Findings */}
          <div className="report-section">
            <h4 className="report-section-heading">Findings</h4>
            <ul className="report-findings-list">
              {report.findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          {/* Section: Impression */}
          <div className="report-section impression-box">
            <h4 className="report-section-heading">Impression</h4>
            <ol className="report-impression-list">
              {report.impression.map((imp, idx) => (
                <li key={idx}><strong>{idx + 1}. </strong>{imp}</li>
              ))}
            </ol>
          </div>

          {/* Signature & Authentication */}
          <div className="report-signature-block">
            <div className="report-sign-info">
              <div className="sign-line" />
              <p className="radiologist-name">{report.radiologist}</p>
              <p className="radiologist-title">{report.radiologistTitle}</p>
              <p className="radiologist-date">Signed electronically on: {report.finalizedDate} 14:22:18 GMT+1</p>
            </div>
            <div className="report-verification-stamp">
              <ShieldCheck size={28} color="#0D9488" />
              <div className="stamp-text">
                <strong>VERIFIED REPORT</strong>
                <span>ResQ Diagnostics Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
