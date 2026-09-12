import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface RegistrationProps {
  onNext: (data: RegistrationData) => void;
  isLoading?: boolean;
}

export interface RegistrationData {
  fullname: string;
  licenseNumber: string;
  phoneNumber: string;
  specialty: string;
  practiceName: string;
  practiceAddress: string;
  email: string;
  password?: string;
}

export const Registration: React.FC<RegistrationProps> = ({ onNext, isLoading = false }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    fullname: '',
    licenseNumber: '',
    phoneNumber: '',
    specialty: '',
    practiceName: '',
    practiceAddress: '',
    email: '',
    password: '',
  });

  const specialties = [
    'Surgeon',
    'General Practitioner',
    'Cardiologist',
    'Pediatrician',
    'Neurologist',
    'Orthopedic Surgeon',
    'Obstetrician/Gynecologist',
    'Dermatologist',
    'Radiologist',
    'Emergency Medicine Physician',
  ];

  const handleChange = (field: keyof RegistrationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname || !formData.email) return;
    onNext(formData);
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#EFF6FF',
            color: '#1D4ED8',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            border: '1px solid #DBEAFE',
          }}>
            Clinician Portal Only
          </span>
        </div>
        <h1 className="registration-heading">Welcome to ResQ</h1>
        <p className="registration-subheading">
          This portal is reserved exclusively for registered medical clinicians and practitioners to manage diagnostic referrals.
        </p>

        <h2 className="registration-section-title">Clinician Registration</h2>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="fullname" className="form-label">
              Fullname
            </label>
            <input
              type="text"
              id="fullname"
              className="input-boxed"
              value={formData.fullname}
              onChange={(e) => handleChange('fullname', e.target.value)}
              placeholder="e.g. Eunice Chisom"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="input-boxed"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g. xyzdiagnosticcenter@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber" className="form-label">
              Medical License Number
            </label>
            <input
              type="text"
              id="licenseNumber"
              className="input-boxed"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              placeholder="e.g. eu-n1345-resq"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="input-boxed"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="e.g. 09180653262"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialty" className="form-label">
              Specialty
            </label>
            <div className="select-boxed-wrapper">
              <select
                id="specialty"
                className="select-boxed"
                value={formData.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Specialty
                </option>
                {specialties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-chevron" size={18} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="practiceName" className="form-label">
              Practice Name
            </label>
            <input
              type="text"
              id="practiceName"
              className="input-boxed"
              value={formData.practiceName}
              onChange={(e) => handleChange('practiceName', e.target.value)}
              placeholder="e.g. Surgeon / Clinic Name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="practiceAddress" className="form-label">
              Practice Address
            </label>
            <input
              type="text"
              id="practiceAddress"
              className="input-boxed"
              value={formData.practiceAddress}
              onChange={(e) => handleChange('practiceAddress', e.target.value)}
              placeholder="e.g. Hospital@outlook.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="regPassword" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="regPassword"
              className="input-boxed"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-actions-left">
            <button
              type="submit"
              className="btn-boxed-primary"
              id="registration-next-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
