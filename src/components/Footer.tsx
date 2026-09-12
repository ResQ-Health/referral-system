import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <span className="copyright-text">2025 MedResQ Healthcare</span>
        <a href="#privacy" onClick={(e) => e.preventDefault()} className="footer-link">
          Privacy Policy
        </a>
        <a href="#support" onClick={(e) => e.preventDefault()} className="footer-link">
          Support
        </a>
      </div>
    </footer>
  );
};
