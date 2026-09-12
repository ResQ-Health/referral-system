import React from 'react';
import { CheckCircle2, LogOut, User, ShieldCheck, Stethoscope, Building2 } from 'lucide-react';

interface DashboardProps {
  user: {
    email: string;
    fullname?: string;
    specialty?: string;
    licenseNumber?: string;
    practiceName?: string;
    isVerified?: boolean;
  };
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header-badge">
          <CheckCircle2 size={28} className="text-success" />
          <div>
            <h1 className="dashboard-title">Welcome to ResQ Health</h1>
            <p className="dashboard-subtitle">Your healthcare provider account is active and verified.</p>
          </div>
        </div>

        <div className="dashboard-details-grid">
          <div className="dashboard-detail-item">
            <User size={18} className="text-muted" />
            <div>
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{user.fullname || 'Healthcare Practitioner'}</span>
            </div>
          </div>

          <div className="dashboard-detail-item">
            <ShieldCheck size={18} className="text-muted" />
            <div>
              <span className="detail-label">Medical License</span>
              <span className="detail-value">{user.licenseNumber || 'Verified Medical ID'}</span>
            </div>
          </div>

          <div className="dashboard-detail-item">
            <Stethoscope size={18} className="text-muted" />
            <div>
              <span className="detail-label">Specialty</span>
              <span className="detail-value">{user.specialty || 'General Practice'}</span>
            </div>
          </div>

          <div className="dashboard-detail-item">
            <Building2 size={18} className="text-muted" />
            <div>
              <span className="detail-label">Practice</span>
              <span className="detail-value">{user.practiceName || 'ResQ Clinic'}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="btn-boxed-primary flex-center-gap"
            onClick={onSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
