import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Building2, User, CreditCard, ShieldCheck, Clock, AlertCircle, Phone } from 'lucide-react';

export interface PaymentTransaction {
  id: string;
  patientName: string;
  patientPhone?: string;
  service: string;
  facility: string;
  date: string;
  amount: string;
  numericAmount: number;
  status: 'Paid' | 'Yet to Pay' | 'Hasn\'t Paid';
  invoiceRef: string;
  paymentMethod: string;
  paidDate?: string;
  dueDate?: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  clinicianName: string;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  clinicianName,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'Paid':
        return 'receipt-status-settled';
      case 'Yet to Pay':
        return 'receipt-status-pending';
      case 'Hasn\'t Paid':
        return 'receipt-status-unpaid';
      default:
        return '';
    }
  };

  const isPaid = transaction.status === 'Paid';

  return (
    <div className="resq-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="resq-receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="receipt-modal-top-bar">
          <div className="receipt-top-title-group">
            <span className="receipt-modal-tag">Patient Billing & Payment</span>
            <h2 className="receipt-modal-title">
              {isPaid ? 'Payment Receipt' : 'Diagnostic Invoice'} • {transaction.invoiceRef}
            </h2>
          </div>
          <div className="receipt-modal-actions">
            <button
              type="button"
              className="receipt-btn-action"
              onClick={handlePrint}
              title="Print Document"
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

        {/* Printable Voucher Paper */}
        <div className="receipt-voucher-sheet" ref={printAreaRef}>
          {/* Header */}
          <div className="voucher-brand-row">
            <div className="voucher-brand-info">
              <div className="voucher-logo-badge">
                <span className="voucher-logo-text">ResQ</span>
                <span className="voucher-logo-sub">HEALTHCARE NETWORK</span>
              </div>
              <p className="voucher-brand-desc">
                Diagnostic Scan Patient Billing & Payment Confirmation
              </p>
            </div>
            <div className="voucher-meta-col">
              <span className={`voucher-status-pill ${getStatusBadgeClass(transaction.status)}`}>
                {transaction.status === 'Paid' && <CheckCircle2 size={13} />}
                {transaction.status === 'Yet to Pay' && <Clock size={13} />}
                {transaction.status === 'Hasn\'t Paid' && <AlertCircle size={13} />}
                <span>{transaction.status.toUpperCase()}</span>
              </span>
              <span className="voucher-date-label">
                {isPaid ? 'Payment Date' : 'Invoice Date'}
              </span>
              <strong className="voucher-date-value">
                {isPaid ? (transaction.paidDate || transaction.date) : transaction.date}
              </strong>
            </div>
          </div>

          <div className="voucher-divider" />

          {/* Patient & Facility Details */}
          <div className="voucher-parties-grid">
            <div className="voucher-party-card">
              <span className="party-card-label">Patient Demographics</span>
              <h4 className="party-card-name">{transaction.patientName}</h4>
              <span className="party-card-sub">
                {transaction.patientPhone ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={11} /> {transaction.patientPhone}
                  </span>
                ) : (
                  'Verified ResQ Patient'
                )}
              </span>
              <div className="party-meta-row">
                <CreditCard size={13} />
                <span>Payment Method: {transaction.paymentMethod}</span>
              </div>
            </div>

            <div className="voucher-party-card">
              <span className="party-card-label">Diagnostic Facility & Doctor</span>
              <h4 className="party-card-name">{transaction.facility}</h4>
              <span className="party-card-sub">
                Referring Clinician: {clinicianName || 'Dr. Gafey Bowlfuel'}
              </span>
              <div className="party-meta-row">
                <Building2 size={13} />
                <span>Order Ref: {transaction.id}</span>
              </div>
            </div>
          </div>

          {/* Service & Investigation Specifics */}
          <div className="voucher-service-table-container">
            <table className="voucher-service-table">
              <thead>
                <tr>
                  <th>Investigation / Scan</th>
                  <th>Patient Name</th>
                  <th>Date Ordered</th>
                  <th style={{ textAlign: 'right' }}>Scan Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{transaction.service}</strong>
                    <span className="service-subtext">Diagnostic Imaging Procedure</span>
                  </td>
                  <td>
                    <div className="voucher-patient-cell">
                      <User size={13} />
                      <span>{transaction.patientName}</span>
                    </div>
                  </td>
                  <td>{transaction.date}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="voucher-amount-bold">{transaction.amount}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Billing Calculation Box */}
          <div className="voucher-summary-wrapper">
            <div className="voucher-verification-note">
              <div className="verification-icon-row">
                <ShieldCheck size={18} color="#0D9488" />
                <span className="verification-title">ResQ Diagnostic Billing Verification</span>
              </div>
              <p className="verification-text">
                {isPaid ? (
                  <>
                    This diagnostic scan payment has been confirmed and cleared through the ResQ Healthcare platform.
                    Present this receipt at <strong>{transaction.facility}</strong> upon arrival for your scan.
                  </>
                ) : (
                  <>
                    Payment for this diagnostic investigation is currently <strong>{transaction.status}</strong>.
                    Prompt settlement ensures prioritized scheduling at <strong>{transaction.facility}</strong>.
                  </>
                )}
              </p>
            </div>

            <div className="voucher-totals-card">
              <div className="voucher-total-row">
                <span>Diagnostic Scan Fee:</span>
                <span>{transaction.amount}</span>
              </div>
              <div className="voucher-total-row">
                <span>Facility Platform & Hospital Levy:</span>
                <span>₦ 0.00</span>
              </div>
              <div className="voucher-total-divider" />
              <div className="voucher-total-row final">
                <span>{isPaid ? 'Total Amount Paid:' : 'Total Amount Due:'}</span>
                <strong className="voucher-final-amount">{transaction.amount}</strong>
              </div>
              <div className="voucher-total-row" style={{ marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: isPaid ? '#059669' : '#DC2626' }}>
                  {isPaid ? 'Payment Status: PAID' : `Payment Status: ${transaction.status.toUpperCase()}`}
                </span>
                <span style={{ fontWeight: 600 }}>
                  {isPaid ? 'Balance: ₦ 0.00' : `Balance: ${transaction.amount}`}
                </span>
              </div>
            </div>
          </div>

          {/* Voucher Footer */}
          <div className="voucher-footer-row">
            <span>Invoice No: {transaction.invoiceRef}</span>
            <span>Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>ResQ Healthcare Technologies Inc.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
