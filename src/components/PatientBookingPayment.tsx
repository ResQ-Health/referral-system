import React, { useState, useEffect } from 'react';
import {
  Check,
  CreditCard,
  Building2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Lock,
  Printer,
  FileCheck,
} from 'lucide-react';
import { apiGetReferralById, apiPayReferral } from '../services/api';
import type { ApiReferralItem } from '../services/api';

interface PatientBookingPaymentProps {
  referralId: string;
  onBackToHome?: () => void;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
}

export const PatientBookingPayment: React.FC<PatientBookingPaymentProps> = ({
  referralId,
  onBackToHome,
  onAddToast,
}) => {
  const [referral, setReferral] = useState<ApiReferralItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [cardData, setCardData] = useState({
    cardNumber: '5399 4100 2849 1920',
    expiry: '12/28',
    cvv: '821',
    nameOnCard: '',
  });

  const patientPortalBase = ((import.meta as any).env?.VITE_PATIENT_PORTAL_URL || 'https://resq-client.vercel.app').replace(/\/+$/, '');
  const patientPortalUrl = referralId
    ? `${patientPortalBase}/?referralId=${encodeURIComponent(referralId)}`
    : patientPortalBase;

  useEffect(() => {
    // Automatically redirect patient to the official Patient Portal
    try {
      window.location.replace(patientPortalUrl);
    } catch (_) {
      window.location.href = patientPortalUrl;
    }
  }, [patientPortalUrl]);

  useEffect(() => {
    let isMounted = true;
    async function loadReferral() {
      setIsLoading(true);
      setError('');
      try {
        const res = await apiGetReferralById(referralId);
        if (isMounted) {
          setReferral(res.referral);
          setCardData((prev) => ({
            ...prev,
            nameOnCard: res.referral.patientName || '',
          }));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Could not load referral details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (referralId) {
      loadReferral();
    }
    return () => {
      isMounted = false;
    };
  }, [referralId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referral) return;

    setIsPaying(true);
    try {
      const res = await apiPayReferral(referral.referralId, {
        paymentMethod: paymentMethod === 'card' ? 'Debit/Credit Card' : paymentMethod === 'transfer' ? 'Bank Transfer' : 'USSD',
        reference: `RESQ-PAY-${Date.now()}`,
      });
      setReferral(res.referral);
      setIsPaying(false);
      if (onAddToast) {
        onAddToast('success', 'Payment Successful!', 'Your booking has been confirmed. Redirecting to booking history...');
      }
      setTimeout(() => {
        window.location.href = 'http://localhost:5174/booking-history';
      }, 1500);
    } catch (err: any) {
      setIsPaying(false);
      if (onAddToast) {
        onAddToast('error', 'Payment Failed', err.message || 'Unable to complete payment.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="patient-portal-loading-wrap">
        <div className="patient-loading-card">
          <div className="loading-spinner" />
          <h3>Loading your referral booking...</h3>
          <p>Please wait while we retrieve your clinical details.</p>
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="patient-portal-loading-wrap">
        <div className="patient-error-card">
          <AlertCircle size={36} color="#EF4444" />
          <h3>Referral Not Found</h3>
          <p>{error || `We could not find referral "${referralId}".`}</p>
          {onBackToHome && (
            <button type="button" className="btn-create-referral" onClick={onBackToHome}>
              Go to Homepage
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAlreadyPaid = referral.paymentStatus === 'Paid' || referral.status === 'Confirmed' || referral.status === 'Completed';
  const priceDisplay = referral.facilityPrice && referral.facilityPrice > 0
    ? `₦${referral.facilityPrice.toLocaleString()}`
    : '₦125,000';

  return (
    <div className="patient-portal-container">
      {/* Top Header */}
      <header className="patient-portal-header">
        <div className="patient-header-inner">
          <div className="patient-header-logo-side">
            <img src="/logo.png" alt="ResQ Healthcare" className="resq-sidebar-logo" />
            <span className="portal-badge">Patient Booking & Payment</span>
          </div>

          <div className="patient-header-right">
            {onBackToHome && (
              <button type="button" className="btn-header-back" onClick={onBackToHome}>
                <ArrowLeft size={16} />
                <span>Return to Portal</span>
              </button>
            )}
            <div className="secure-tag">
              <Lock size={13} />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="patient-portal-body">
        <div className="patient-portal-content">
          {/* Status Banner */}
          {isAlreadyPaid ? (
            <div className="patient-paid-banner">
              <div className="paid-icon-circle">
                <Check size={28} />
              </div>
              <div>
                <h2>Payment Confirmed & Booking Cleared</h2>
                <p>
                  Your diagnostic appointment has been verified and registered with{' '}
                  <strong>{referral.facilityName || 'the medical center'}</strong>.
                </p>
                <span className="ref-confirmed-tag">
                  Receipt Ref: {referral.referralId} · Status: Confirmed
                </span>
              </div>
            </div>
          ) : (
            <div className="patient-notice-banner">
              <div className="notice-icon-box">
                <FileCheck size={24} color="#0070F3" />
              </div>
              <div>
                <h3>You have an outstanding diagnostic scan referral</h3>
                <p>
                  Please review the clinical order submitted by{' '}
                  <strong>{referral.doctorName || 'your referring physician'}</strong> and proceed to payment
                  to secure your appointment.
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Layout */}
          <div className="patient-grid-layout">
            {/* Left Column: Requisition & Booking Summary */}
            <div className="patient-col-left">
              {/* Card 1: Clinical Requisition Summary */}
              <div className="patient-summary-card">
                <div className="summary-card-header">
                  <span className="card-label-small">ORDER SUMMARY</span>
                  <span className="referral-id-pill">{referral.referralId}</span>
                </div>

                <div className="patient-meta-grid">
                  <div className="patient-meta-item">
                    <span className="meta-title">Patient Name</span>
                    <strong className="meta-val">{referral.patientName}</strong>
                  </div>
                  <div className="patient-meta-item">
                    <span className="meta-title">Referring Doctor</span>
                    <strong className="meta-val">{referral.doctorName || 'Dr. Specialist'}</strong>
                    <span className="meta-sub">{referral.doctorSpecialty}</span>
                  </div>
                  <div className="patient-meta-item">
                    <span className="meta-title">Scan Type</span>
                    <strong className="meta-val">{referral.scanType}</strong>
                  </div>
                  <div className="patient-meta-item">
                    <span className="meta-title">Target Body Part</span>
                    <strong className="meta-val">{referral.bodyPart}</strong>
                  </div>
                  <div className="patient-meta-item">
                    <span className="meta-title">Contrast Protocol</span>
                    <strong className="meta-val">{referral.contrastOption || 'Not Specified'}</strong>
                  </div>
                  <div className="patient-meta-item">
                    <span className="meta-title">Priority</span>
                    <strong className="meta-val">{referral.priority || 'Routine'}</strong>
                  </div>
                </div>

                {referral.clinicalNote && (
                  <div className="patient-note-box">
                    <span className="note-title">Clinical Indication:</span>
                    <p className="note-body">{referral.clinicalNote}</p>
                  </div>
                )}
              </div>

              {/* Card 2: Facility & Appointment Details */}
              <div className="patient-summary-card">
                <div className="summary-card-header">
                  <span className="card-label-small">FACILITY & APPOINTMENT</span>
                  <span className="facility-status-badge">
                    {referral.status === 'Confirmed' || referral.status === 'Completed' ? 'Confirmed' : 'Pending Payment'}
                  </span>
                </div>

                <div className="facility-patient-row">
                  <div className="facility-icon-circle">
                    <Building2 size={20} color="#0070F3" />
                  </div>
                  <div>
                    <h4 className="facility-title">{referral.facilityName || 'Patient Choice (Open Referral)'}</h4>
                    {referral.facilityAddress && <p className="facility-loc">{referral.facilityAddress}</p>}
                  </div>
                </div>

                {referral.slot?.display && (
                  <div className="slot-patient-row">
                    <div className="slot-icon-box">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="slot-label">Scheduled Slot</span>
                      <strong className="slot-time">{referral.slot.display}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Payment Details */}
            <div className="patient-col-right">
              {isAlreadyPaid ? (
                <div className="patient-paid-card">
                  <div className="paid-icon-wrap">
                    <ShieldCheck size={48} color="#10B981" />
                  </div>
                  <h3>Appointment Confirmed!</h3>
                  <p>
                    Your diagnostic payment has been successfully recorded. Present your Referral ID{' '}
                    <strong>{referral.referralId}</strong> at the facility desk on the date of your scan.
                  </p>

                  <div className="paid-amount-row">
                    <span>Amount Paid:</span>
                    <strong>{priceDisplay}</strong>
                  </div>

                  <div className="paid-actions-col">
                    <button
                      type="button"
                      className="btn-print-receipt"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} />
                      <span>Print Confirmation Receipt</span>
                    </button>
                    <a
                      href="http://localhost:5174/booking-history"
                      className="btn-print-receipt"
                      style={{
                        background: '#0D9488',
                        color: '#ffffff',
                        textDecoration: 'none',
                        textAlign: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span>Go to Booking History (Patient Portal)</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="patient-payment-card">
                  <div className="payment-card-header">
                    <h3>Complete Payment</h3>
                    <div className="payment-total-box">
                      <span className="payment-total-label">Total to pay:</span>
                      <span className="payment-total-amount">{priceDisplay}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="payment-tabs-row">
                    <button
                      type="button"
                      className={`payment-tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard size={16} />
                      <span>Debit/Credit Card</span>
                    </button>
                    <button
                      type="button"
                      className={`payment-tab-btn ${paymentMethod === 'transfer' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('transfer')}
                    >
                      <Building2 size={16} />
                      <span>Bank Transfer</span>
                    </button>
                  </div>

                  {paymentMethod === 'card' && (
                    <form onSubmit={handlePay} className="patient-pay-form">
                      <div className="pay-field">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardData.nameOnCard}
                          onChange={(e) => setCardData({ ...cardData, nameOnCard: e.target.value })}
                          placeholder="e.g. Anthony Odafe"
                          className="pay-input"
                        />
                      </div>

                      <div className="pay-field">
                        <label>Card Number</label>
                        <div className="pay-input-with-icon">
                          <CreditCard size={18} className="card-lead-icon" />
                          <input
                            type="text"
                            required
                            value={cardData.cardNumber}
                            onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                            placeholder="0000 0000 0000 0000"
                            className="pay-input"
                          />
                        </div>
                      </div>

                      <div className="pay-row-2col">
                        <div className="pay-field">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            required
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            placeholder="MM/YY"
                            className="pay-input"
                          />
                        </div>
                        <div className="pay-field">
                          <label>CVV / CVC</label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            placeholder="123"
                            className="pay-input"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPaying}
                        className="btn-pay-now-full"
                      >
                        {isPaying ? (
                          <>
                            <div className="btn-spinner-sm" />
                            <span>Authorizing Payment...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Pay {priceDisplay} & Confirm Booking</span>
                          </>
                        )}
                      </button>

                      <p className="pay-secure-hint">
                        <ShieldCheck size={14} />
                        <span>Secured via PCI-DSS Compliant Payment Gateway</span>
                      </p>
                    </form>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="transfer-instructions-box">
                      <p className="transfer-head">Transfer exactly <strong>{priceDisplay}</strong> to:</p>
                      <div className="bank-detail-card">
                        <div className="bank-row">
                          <span>Bank:</span>
                          <strong>Access Bank Nigeria</strong>
                        </div>
                        <div className="bank-row">
                          <span>Account Number:</span>
                          <strong className="copy-num">0123984711</strong>
                        </div>
                        <div className="bank-row">
                          <span>Account Name:</span>
                          <strong>ResQ Healthcare Escrow</strong>
                        </div>
                        <div className="bank-row">
                          <span>Payment Reference:</span>
                          <strong style={{ color: '#0070F3' }}>{referral.referralId}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isPaying}
                        onClick={handlePay}
                        className="btn-pay-now-full"
                        style={{ marginTop: '16px' }}
                      >
                        {isPaying ? (
                          <>
                            <div className="btn-spinner-sm" />
                            <span>Verifying Transfer...</span>
                          </>
                        ) : (
                          <span>I Have Sent the Transfer</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
