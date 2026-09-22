import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  TrendingUp,
  X,
  Activity,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Send,
  User,
  Phone,
} from 'lucide-react';
import { INITIAL_PAYMENT_TRANSACTIONS } from '../data/clinicalData';
import { PaymentReceiptModal, type PaymentTransaction } from './PaymentReceiptModal';
import { Pagination } from './Pagination';

interface PaymentsViewProps {
  user?: any;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
  onOpenNewReferral?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  user,
  onAddToast,
}) => {
  const [transactions] = useState<PaymentTransaction[]>(INITIAL_PAYMENT_TRANSACTIONS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Yet to Pay' | "Hasn't Paid">('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-month'>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [amountTier, setAmountTier] = useState<'all' | 'under-50k' | '50k-100k' | 'over-100k'>('all');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const pageSize = 8;

  // Filter transactions across all criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Status filter
      if (statusFilter !== 'all' && txn.status !== statusFilter) {
        return false;
      }
      // Date filter
      if (dateRange === 'this-month' && !txn.date.includes('Sep')) {
        return false;
      }
      if (dateRange === 'last-month' && !txn.date.includes('Aug')) {
        return false;
      }
      // Modality filter
      if (modalityFilter !== 'all') {
        const serviceLower = txn.service.toLowerCase();
        const modLower = modalityFilter.toLowerCase();
        if (!serviceLower.includes(modLower)) {
          return false;
        }
      }
      // Facility filter
      if (facilityFilter !== 'all') {
        if (!txn.facility.toLowerCase().includes(facilityFilter.toLowerCase())) {
          return false;
        }
      }
      // Amount tier filter
      if (amountTier === 'under-50k' && txn.numericAmount >= 50000) {
        return false;
      }
      if (amountTier === '50k-100k' && (txn.numericAmount < 50000 || txn.numericAmount > 100000)) {
        return false;
      }
      if (amountTier === 'over-100k' && txn.numericAmount <= 100000) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = txn.id.toLowerCase().includes(q) || txn.invoiceRef.toLowerCase().includes(q);
        const matchPatient = txn.patientName.toLowerCase().includes(q);
        const matchFacility = txn.facility.toLowerCase().includes(q);
        const matchService = txn.service.toLowerCase().includes(q);
        const matchPhone = txn.patientPhone?.toLowerCase().includes(q) || false;
        return matchId || matchPatient || matchFacility || matchService || matchPhone;
      }
      return true;
    });
  }, [transactions, statusFilter, dateRange, modalityFilter, facilityFilter, amountTier, searchQuery]);

  // Unique facilities list for advanced drawer
  const uniqueFacilities = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      const name = t.facility.split(',')[0].trim();
      set.add(name);
    });
    return Array.from(set);
  }, [transactions]);

  // Real-time sum of filtered transactions
  const filteredTotalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.numericAmount, 0);
  }, [filteredTransactions]);

  const isAnyFilterActive =
    statusFilter !== 'all' ||
    modalityFilter !== 'all' ||
    dateRange !== 'all' ||
    facilityFilter !== 'all' ||
    amountTier !== 'all' ||
    searchQuery.trim() !== '';

  // Reset page on filter changes
  const handleStatusFilterChange = (filter: 'all' | 'Paid' | 'Yet to Pay' | "Hasn't Paid") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value as any);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setModalityFilter('all');
    setDateRange('all');
    setFacilityFilter('all');
    setAmountTier('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Patient Payment Counts & Volumes
  const paidCount = useMemo(() => transactions.filter((t) => t.status === 'Paid').length, [transactions]);
  const yetToPayCount = useMemo(() => transactions.filter((t) => t.status === 'Yet to Pay').length, [transactions]);
  const hasntPaidCount = useMemo(() => transactions.filter((t) => t.status === "Hasn't Paid").length, [transactions]);

  const paidAmount = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Paid')
      .reduce((sum, t) => sum + t.numericAmount, 0);
  }, [transactions]);

  const yetToPayAmount = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Yet to Pay')
      .reduce((sum, t) => sum + t.numericAmount, 0);
  }, [transactions]);

  const hasntPaidAmount = useMemo(() => {
    return transactions
      .filter((t) => t.status === "Hasn't Paid")
      .reduce((sum, t) => sum + t.numericAmount, 0);
  }, [transactions]);

  const totalBilledAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.numericAmount, 0);
  }, [transactions]);

  const handleViewReceipt = (txn: PaymentTransaction) => {
    setSelectedTxn(txn);
    setIsReceiptOpen(true);
  };

  const handleSendPaymentLink = (txn: PaymentTransaction) => {
    if (onAddToast) {
      onAddToast(
        'success',
        'Payment Link Sent',
        `Diagnostic payment link dispatched to ${txn.patientName} (${txn.patientPhone || 'SMS/Email'}).`
      );
    }
  };

  const handleSendReminder = (txn: PaymentTransaction) => {
    if (onAddToast) {
      onAddToast(
        'success',
        'Reminder Dispatched',
        `Gentle payment reminder sent to ${txn.patientName} for ${txn.service}.`
      );
    }
  };

  const handleDownloadStatement = () => {
    if (onAddToast) {
      onAddToast('success', 'Billing Report Ready', 'Patient diagnostic scan payments summary (Sep 2026) generated.');
    }
  };

  return (
    <div className="payments-view-wrapper">
      <div className="payments-page-layout">
        {/* Top Header */}
        <div className="payments-top-header">
          <div className="payments-header-title-group">
            <div className="payments-header-badge">
              <CreditCard size={13} />
              <span>Patient Billing & Scan Payments</span>
            </div>
            <h1 className="payments-main-title">Patient Payments</h1>
            <p className="payments-main-subtitle">
              Monitor diagnostic scan payments, track patients who have paid, and follow up with patients yet to pay.
            </p>
          </div>
          <div className="payments-header-actions">
            <button
              type="button"
              className="btn-statement-download"
              onClick={handleDownloadStatement}
            >
              <Download size={15} />
              <span>Download Payment Report</span>
            </button>
          </div>
        </div>

        {/* Patient Billing KPI Cards */}
        <div className="payments-kpi-grid">
          {/* 1. Patients Paid */}
          <div className="payment-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Patients Paid</span>
              <span className="kpi-icon-pill green">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-amount">{paidCount} Patients</span>
            </div>
            <div className="kpi-subtext">
              <span className="text-emerald-600 font-medium">₦ {paidAmount.toLocaleString()}</span> collected • Confirmed scans
            </div>
          </div>

          {/* 2. Yet to Pay */}
          <div className="payment-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Yet to Pay</span>
              <span className="kpi-icon-pill amber">
                <Clock size={16} />
              </span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-amount">{yetToPayCount} Patients</span>
            </div>
            <div className="kpi-subtext">
              <span className="text-amber-600 font-medium">₦ {yetToPayAmount.toLocaleString()}</span> • Awaiting scan payment
            </div>
          </div>

          {/* 3. Hasn't Paid */}
          <div className="payment-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Hasn't Paid</span>
              <span className="kpi-icon-pill" style={{ background: '#FFE4E6', color: '#E11D48' }}>
                <AlertCircle size={16} />
              </span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-amount">{hasntPaidCount} Patients</span>
            </div>
            <div className="kpi-subtext">
              <span className="text-rose-600 font-medium">₦ {hasntPaidAmount.toLocaleString()}</span> • Overdue or unpaid
            </div>
          </div>

          {/* 4. Total Invoices */}
          <div className="payment-kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-label">Total Invoices</span>
              <span className="kpi-icon-pill blue">
                <TrendingUp size={16} />
              </span>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-amount">{transactions.length} Referrals</span>
            </div>
            <div className="kpi-subtext">
              ₦ {totalBilledAmount.toLocaleString()} total diagnostic billing volume
            </div>
          </div>
        </div>

        {/* Senior Healthtech Filter & Search Experience */}
        <div className="payments-filter-container">
          {/* Main Toolbar */}
          <div className="payments-filter-toolbar">
            {/* Left: Status Segmented Tabs with colored status dots and counts */}
            <div className="payments-status-tabs" role="tablist" aria-label="Patient payment status filter">
              <button
                type="button"
                className={`status-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('all')}
              >
                <span className="status-dot dot-all" />
                <span className="status-tab-text">All</span>
                <span className="status-tab-count">{transactions.length}</span>
              </button>
              <button
                type="button"
                className={`status-tab-btn ${statusFilter === 'Paid' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('Paid')}
              >
                <span className="status-dot dot-paid" />
                <span className="status-tab-text">Paid</span>
                <span className="status-tab-count">{paidCount}</span>
              </button>
              <button
                type="button"
                className={`status-tab-btn ${statusFilter === 'Yet to Pay' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('Yet to Pay')}
              >
                <span className="status-dot dot-yet-to-pay" />
                <span className="status-tab-text">Yet to Pay</span>
                <span className="status-tab-count">{yetToPayCount}</span>
              </button>
              <button
                type="button"
                className={`status-tab-btn ${statusFilter === "Hasn't Paid" ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange("Hasn't Paid")}
              >
                <span className="status-dot dot-hasnt-paid" />
                <span className="status-tab-text">Hasn't Paid</span>
                <span className="status-tab-count">{hasntPaidCount}</span>
              </button>
            </div>

            {/* Right: Search, Modality, Date & Advanced Filter Trigger */}
            <div className="payments-filter-controls">
              {/* Search Bar */}
              <div className="payments-search-wrapper">
                <Search size={15} className="payments-search-icon" />
                <input
                  type="text"
                  placeholder="Search patient, invoice, scan, center..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="payments-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="payments-search-clear"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Modality Filter Dropdown */}
              <div className="filter-select-wrapper">
                <Activity size={14} className="filter-select-icon" />
                <select
                  className="filter-custom-select"
                  value={modalityFilter}
                  onChange={(e) => {
                    setModalityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by scan modality"
                >
                  <option value="all">All Modalities</option>
                  <option value="MRI">MRI Scans</option>
                  <option value="CT">CT Scans</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="Echocardiogram">Echocardiogram</option>
                  <option value="Mammography">Mammography</option>
                </select>
                <ChevronDown size={13} className="filter-select-chevron" />
              </div>

              {/* Date Filter Dropdown */}
              <div className="filter-select-wrapper">
                <Calendar size={14} className="filter-select-icon" />
                <select
                  className="filter-custom-select"
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  aria-label="Filter by date range"
                >
                  <option value="all">All Dates</option>
                  <option value="this-month">Sep 2026 (This Month)</option>
                  <option value="last-month">Aug 2026 (Last Month)</option>
                </select>
                <ChevronDown size={13} className="filter-select-chevron" />
              </div>

              {/* Advanced Filters Trigger */}
              <button
                type="button"
                className={`btn-more-filters ${isMoreFiltersOpen ? 'open' : ''} ${(facilityFilter !== 'all' || amountTier !== 'all') ? 'has-active' : ''}`}
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                title="Toggle additional filters (Facility, Amount Tier)"
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {(facilityFilter !== 'all' || amountTier !== 'all') && (
                  <span className="filter-active-count-badge">
                    {(facilityFilter !== 'all' ? 1 : 0) + (amountTier !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters Tray */}
          {isMoreFiltersOpen && (
            <div className="payments-advanced-drawer">
              <div className="advanced-drawer-grid">
                <div className="advanced-drawer-col">
                  <label className="advanced-filter-label">Diagnostic Center</label>
                  <select
                    className="advanced-filter-select"
                    value={facilityFilter}
                    onChange={(e) => {
                      setFacilityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Network Facilities ({uniqueFacilities.length})</option>
                    {uniqueFacilities.map((fac) => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                <div className="advanced-drawer-col">
                  <label className="advanced-filter-label">Scan Fee Range</label>
                  <select
                    className="advanced-filter-select"
                    value={amountTier}
                    onChange={(e) => {
                      setAmountTier(e.target.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Scan Prices</option>
                    <option value="under-50k">Under ₦50,000</option>
                    <option value="50k-100k">₦50,000 – ₦100,000</option>
                    <option value="over-100k">Over ₦100,000 (Specialized)</option>
                  </select>
                </div>

                <div className="advanced-drawer-actions">
                  <button
                    type="button"
                    className="btn-reset-drawer"
                    onClick={() => {
                      setFacilityFilter('all');
                      setAmountTier('all');
                      setCurrentPage(1);
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset Advanced</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Live Summary Bar */}
          <div className="payments-filter-summary-row">
            <div className="filter-chips-cluster">
              <span className="summary-match-count">
                Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> patient billings
              </span>

              {isAnyFilterActive && (
                <div className="active-chips-list">
                  {statusFilter !== 'all' && (
                    <span className="active-chip">
                      Status: <strong>{statusFilter}</strong>
                      <button type="button" onClick={() => handleStatusFilterChange('all')} aria-label="Remove status filter">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {modalityFilter !== 'all' && (
                    <span className="active-chip">
                      Modality: <strong>{modalityFilter}</strong>
                      <button type="button" onClick={() => { setModalityFilter('all'); setCurrentPage(1); }} aria-label="Remove modality filter">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {dateRange !== 'all' && (
                    <span className="active-chip">
                      Date: <strong>{dateRange === 'this-month' ? 'Sep 2026' : 'Aug 2026'}</strong>
                      <button type="button" onClick={() => { setDateRange('all'); setCurrentPage(1); }} aria-label="Remove date filter">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {facilityFilter !== 'all' && (
                    <span className="active-chip">
                      Facility: <strong>{facilityFilter}</strong>
                      <button type="button" onClick={() => { setFacilityFilter('all'); setCurrentPage(1); }} aria-label="Remove facility filter">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {amountTier !== 'all' && (
                    <span className="active-chip">
                      Fee: <strong>{amountTier === 'under-50k' ? '< ₦50k' : amountTier === '50k-100k' ? '₦50k–₦100k' : '> ₦100k'}</strong>
                      <button type="button" onClick={() => { setAmountTier('all'); setCurrentPage(1); }} aria-label="Remove price filter">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="active-chip">
                      Query: <strong>"{searchQuery}"</strong>
                      <button type="button" onClick={() => { setSearchQuery(''); setCurrentPage(1); }} aria-label="Clear search">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    className="clear-all-filters-btn"
                    onClick={handleClearAllFilters}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Financial Live Total for Filtered Selection */}
            <div className="filter-financial-pill">
              <span className="financial-pill-label">Filtered Billing:</span>
              <strong className="financial-pill-amount">₦ {filteredTotalAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="payments-table-container">
          <div className="payments-table-card">
            <table className="resq-table payments-main-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient & Contact</th>
                  <th>Diagnostic Scan</th>
                  <th>Diagnostic Center</th>
                  <th>Scan Fee</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedTransactions.length > 0 ? (
                  pagedTransactions.map((txn) => {
                    const isPaid = txn.status === 'Paid';
                    const isYetToPay = txn.status === 'Yet to Pay';
                    const isHasntPaid = txn.status === "Hasn't Paid";

                    const statusClass = isPaid
                      ? 'pill-paid'
                      : isYetToPay
                      ? 'pill-yet-to-pay'
                      : 'pill-hasnt-paid';

                    return (
                      <tr key={txn.id} className="payment-table-row">
                        <td>
                          <span className="txn-id-badge">{txn.id}</span>
                          <span className="txn-invoice-sub">{txn.date}</span>
                        </td>
                        <td>
                          <div className="table-patient-cell">
                            <span className="table-patient-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <User size={13} color="#0D9488" />
                              {txn.patientName}
                            </span>
                            {txn.patientPhone && (
                              <span className="table-service-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
                                <Phone size={10} />
                                {txn.patientPhone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-patient-cell">
                            <span className="table-patient-name" style={{ fontWeight: 500, color: '#1E293B' }}>
                              {txn.service}
                            </span>
                            <span className="table-service-name" style={{ fontSize: '11px', color: '#64748B' }}>
                              Method: {txn.paymentMethod}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="table-facility-cell">
                            <Building2 size={13} color="#64748B" />
                            <span>{txn.facility}</span>
                          </div>
                        </td>
                        <td>
                          <strong className="table-amount-cell">{txn.amount}</strong>
                        </td>
                        <td>
                          <div>
                            <span className={`payment-status-pill ${statusClass}`}>
                              {isPaid && <CheckCircle2 size={12} />}
                              {isYetToPay && <Clock size={12} />}
                              {isHasntPaid && <AlertCircle size={12} />}
                              <span>{txn.status}</span>
                            </span>
                            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px' }}>
                              {isPaid && `Paid ${txn.paidDate || txn.date}`}
                              {isYetToPay && `Due ${txn.dueDate || txn.date}`}
                              {isHasntPaid && `Overdue since ${txn.dueDate || txn.date}`}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="btn-table-action-group">
                            {isPaid ? (
                              <button
                                type="button"
                                className="btn-table-receipt"
                                onClick={() => handleViewReceipt(txn)}
                                title="View confirmed patient payment receipt"
                              >
                                <FileText size={13} />
                                <span>Receipt</span>
                              </button>
                            ) : isYetToPay ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-table-send-link"
                                  onClick={() => handleSendPaymentLink(txn)}
                                  title="Send payment link to patient via SMS/WhatsApp"
                                >
                                  <Send size={11} />
                                  <span>Send Link</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-table-receipt"
                                  onClick={() => handleViewReceipt(txn)}
                                  title="View scan billing invoice"
                                >
                                  <FileText size={13} />
                                  <span>Invoice</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-table-send-link"
                                  style={{ background: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                                  onClick={() => handleSendReminder(txn)}
                                  title="Send urgent payment reminder to patient"
                                >
                                  <Send size={11} />
                                  <span>Reminder</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-table-receipt"
                                  onClick={() => handleViewReceipt(txn)}
                                  title="View overdue billing invoice"
                                >
                                  <FileText size={13} />
                                  <span>Invoice</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="table-empty-row">
                      <div className="table-empty-state">
                        <AlertCircle size={32} color="#94A3B8" />
                        <p className="table-empty-title">No patient payments match your filters</p>
                        <p className="table-empty-sub">
                          Try switching payment status tabs, clearing your search query, or resetting filters.
                        </p>
                        {isAnyFilterActive && (
                          <button
                            type="button"
                            className="btn-clear-empty-filter"
                            onClick={handleClearAllFilters}
                          >
                            <RotateCcw size={13} />
                            <span>Reset All Filters</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Right-Aligned Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="patient payments"
          />
        </div>

        {/* Diagnostic Scan Payment Receipt / Invoice Modal */}
        <PaymentReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedTxn(null);
          }}
          transaction={selectedTxn}
          clinicianName={user?.fullname || user?.name || 'Dr. Gafey Bowlfuel'}
        />
      </div>
    </div>
  );
};
