import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Download,
  Search,
  Building2,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { INITIAL_DIAGNOSTIC_REPORTS } from '../data/clinicalData';
import { RadiologyReportModal, type DiagnosticReport } from './RadiologyReportModal';
import { Pagination } from './Pagination';

interface ReportsViewProps {
  user?: any;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  user,
  onAddToast,
}) => {
  const [reports] = useState<DiagnosticReport[]>(INITIAL_DIAGNOSTIC_REPORTS);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Radiology' | 'Ultrasound'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageSize = 6;

  // Filter logic
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (categoryFilter !== 'All' && rep.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = rep.accessionId.toLowerCase().includes(q) || rep.patientId.toLowerCase().includes(q);
        const matchName = rep.patientName.toLowerCase().includes(q);
        const matchModality = rep.modality.toLowerCase().includes(q) || rep.anatomicalRegion.toLowerCase().includes(q);
        const matchFacility = rep.facility.toLowerCase().includes(q) || rep.radiologist.toLowerCase().includes(q);
        return matchId || matchName || matchModality || matchFacility;
      }
      return true;
    });
  }, [reports, categoryFilter, searchQuery]);

  const handleCategoryFilter = (cat: 'All' | 'Radiology' | 'Ultrasound') => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const handleViewReport = (rep: DiagnosticReport) => {
    setSelectedReport(rep);
    setIsModalOpen(true);
  };

  const handleDownloadPdf = (rep: DiagnosticReport) => {
    if (onAddToast) {
      onAddToast('success', 'Report Exported', `Radiology report ${rep.accessionId} downloaded.`);
    }
  };

  const handleExportAudit = () => {
    if (onAddToast) {
      onAddToast('success', 'Exporting Registry', 'Generating CSV archive of all verified clinical reports.');
    }
  };

  return (
    <div className="reports-view-wrapper">
      <div className="reports-page-layout">
        {/* Top Header */}
        <div className="reports-top-header">
          <div className="reports-header-title-group">
            <div className="reports-header-badge">
              <PieChart size={13} />
              <span>Diagnostic Records & Analytics</span>
            </div>
            <h1 className="reports-main-title">Diagnostic & Clinical Reports</h1>
            <p className="reports-main-subtitle">
              Access verified radiologist impressions, diagnostic imaging results, and referral turnaround analytics.
            </p>
          </div>
          <div className="reports-header-actions">
            <button
              type="button"
              className="btn-statement-download"
              onClick={handleExportAudit}
            >
              <Download size={15} />
              <span>Export Registry</span>
            </button>
          </div>
        </div>

        {/* Analytics KPIs */}
        <div className="reports-kpi-grid">
          <div className="report-kpi-card">
            <span className="kpi-label">Total Referrals</span>
            <div className="kpi-value-row">
              <span className="kpi-amount">68</span>
            </div>
            <div className="kpi-subtext">Across all modalities</div>
          </div>

          <div className="report-kpi-card">
            <span className="kpi-label">Finalized Reports</span>
            <div className="kpi-value-row">
              <span className="kpi-amount text-emerald-600">48</span>
            </div>
            <div className="kpi-subtext">
              <span className="text-emerald-700 font-medium">96%</span> compliance rate
            </div>
          </div>

          <div className="report-kpi-card">
            <span className="kpi-label">Avg. Turnaround Time</span>
            <div className="kpi-value-row">
              <span className="kpi-amount">14.2 <span className="kpi-unit">hrs</span></span>
            </div>
            <div className="kpi-subtext">Benchmarked against 48h avg</div>
          </div>

          <div className="report-kpi-card">
            <span className="kpi-label">Quality Index</span>
            <div className="kpi-value-row">
              <span className="kpi-amount">99.1%</span>
            </div>
            <div className="kpi-subtext">Consultant verified</div>
          </div>
        </div>

        {/* Clinical Analytics Summary Grid */}
        <div className="reports-analytics-section">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">Referrals by Modality</h3>
              <span className="analytics-card-sub">Distribution of requests</span>
            </div>
            <div className="modality-bars-container">
              <div className="modality-bar-item">
                <div className="modality-bar-header">
                  <span className="modality-name">Magnetic Resonance (MRI)</span>
                  <span className="modality-stat">26 scans (38%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill teal" style={{ width: '38%' }} />
                </div>
              </div>

              <div className="modality-bar-item">
                <div className="modality-bar-header">
                  <span className="modality-name">Computed Tomography (CT)</span>
                  <span className="modality-stat">19 scans (28%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill blue" style={{ width: '28%' }} />
                </div>
              </div>

              <div className="modality-bar-item">
                <div className="modality-bar-header">
                  <span className="modality-name">Ultrasound & Sonography</span>
                  <span className="modality-stat">12 scans (18%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill slate" style={{ width: '18%' }} />
                </div>
              </div>

              <div className="modality-bar-item">
                <div className="modality-bar-header">
                  <span className="modality-name">Digital Radiography (X-Ray)</span>
                  <span className="modality-stat">8 scans (12%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill amber" style={{ width: '12%' }} />
                </div>
              </div>

              <div className="modality-bar-item">
                <div className="modality-bar-header">
                  <span className="modality-name">Mammography</span>
                  <span className="modality-stat">3 scans (4%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill purple" style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">Diagnostic Partner Performance</h3>
              <span className="analytics-card-sub">Volume & report turnaround</span>
            </div>
            <div className="partner-performance-list">
              <div className="partner-perf-item">
                <div className="partner-perf-info">
                  <span className="partner-perf-name">EchoScan Diagnostics</span>
                  <span className="partner-perf-meta">Victoria Island • 22 scans</span>
                </div>
                <div className="partner-perf-metric">
                  <span className="perf-time">11.8 hrs</span>
                  <span className="perf-tag on-time">98% on-time</span>
                </div>
              </div>

              <div className="partner-perf-item">
                <div className="partner-perf-info">
                  <span className="partner-perf-name">Clinix Healthcare</span>
                  <span className="partner-perf-meta">Ilupeju • 16 scans</span>
                </div>
                <div className="partner-perf-metric">
                  <span className="perf-time">13.5 hrs</span>
                  <span className="perf-tag on-time">96% on-time</span>
                </div>
              </div>

              <div className="partner-perf-item">
                <div className="partner-perf-info">
                  <span className="partner-perf-name">St. Nicholas Diagnostic Centre</span>
                  <span className="partner-perf-meta">Lagos Island • 15 scans</span>
                </div>
                <div className="partner-perf-metric">
                  <span className="perf-time">15.0 hrs</span>
                  <span className="perf-tag on-time">94% on-time</span>
                </div>
              </div>

              <div className="partner-perf-item">
                <div className="partner-perf-info">
                  <span className="partner-perf-name">MeCure Healthcare</span>
                  <span className="partner-perf-meta">Lekki • 15 scans</span>
                </div>
                <div className="partner-perf-metric">
                  <span className="perf-time">16.4 hrs</span>
                  <span className="perf-tag on-time">92% on-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Category Filters & Search */}
        <div className="reports-toolbar-card">
          <div className="reports-toolbar-left">
            <div className="reports-filter-pills">
              <button
                type="button"
                className={`filter-pill ${categoryFilter === 'All' ? 'active' : ''}`}
                onClick={() => handleCategoryFilter('All')}
              >
                All Reports ({reports.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${categoryFilter === 'Radiology' ? 'active' : ''}`}
                onClick={() => handleCategoryFilter('Radiology')}
              >
                Radiology & MRI ({reports.filter((r) => r.category === 'Radiology').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${categoryFilter === 'Ultrasound' ? 'active' : ''}`}
                onClick={() => handleCategoryFilter('Ultrasound')}
              >
                Ultrasound ({reports.filter((r) => r.category === 'Ultrasound').length})
              </button>
            </div>
          </div>

          <div className="reports-toolbar-right">
            <div className="reports-search-box">
              <Search size={15} color="#64748B" />
              <input
                type="text"
                placeholder="Search patient, accession ID, radiologist..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="reports-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Reports Registry Table */}
        <div className="reports-table-container">
          <div className="reports-table-card">
            <table className="resq-table reports-main-table">
              <thead>
                <tr>
                  <th>Accession ID</th>
                  <th>Patient</th>
                  <th>Modality & Region</th>
                  <th>Diagnostic Facility</th>
                  <th>Finalized Date</th>
                  <th>Radiologist Impression</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedReports.length > 0 ? (
                  pagedReports.map((rep) => (
                    <tr key={rep.accessionId} className="report-table-row">
                      <td>
                        <span className="accession-badge">{rep.accessionId}</span>
                        <span className="accession-date-sub">{rep.examDate}</span>
                      </td>
                      <td>
                        <div className="table-patient-cell">
                          <span className="table-patient-name">{rep.patientName}</span>
                          <span className="table-sub-info">
                            {rep.patientGender} • {rep.patientDob}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-scan-cell">
                          <span className="table-service-name">{rep.modality}</span>
                          <span className="table-sub-info">{rep.anatomicalRegion}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-facility-cell">
                          <Building2 size={13} color="#64748B" />
                          <span>{rep.facility}</span>
                        </div>
                        <span className="radiologist-sub-cell">{rep.radiologist}</span>
                      </td>
                      <td>
                        <span className="table-date-text">{rep.finalizedDate}</span>
                      </td>
                      <td>
                        <p className="table-impression-snippet" title={rep.impression[0]}>
                          {rep.impression[0]}
                        </p>
                      </td>
                      <td>
                        <span className="report-status-pill finalized">
                          <span className="status-dot" />
                          {rep.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group-right">
                          <button
                            type="button"
                            className="btn-table-action btn-view-report"
                            onClick={() => handleViewReport(rep)}
                            title="View Full Radiology Report"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="btn-table-action-icon"
                            onClick={() => handleDownloadPdf(rep)}
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty-row">
                      <div className="table-empty-state">
                        <AlertCircle size={28} color="#94A3B8" />
                        <p className="table-empty-title">No clinical reports found</p>
                        <p className="table-empty-sub">Adjust your search or filter to view results.</p>
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
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="reports"
          />
        </div>
      </div>

      {/* Radiology Report Modal */}
      <RadiologyReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedReport}
        referringDoctor={user?.fullname}
      />
    </div>
  );
};
