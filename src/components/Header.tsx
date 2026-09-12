import React from 'react';

interface HeaderProps {
  currentScreen: 'signin' | 'registration' | 'verification';
  onNavigate: (screen: 'signin' | 'registration' | 'verification') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          onClick={() => onNavigate('signin')}
          className="logo-button"
          aria-label="ResQ Home"
        >
          <img src="/logo.png" alt="RESQ" className="resq-logo" />
        </button>
      </div>

      <div className="header-right">
        {currentScreen === 'signin' && (
          <div className="header-auth-prompt">
            <span className="prompt-text">No account?</span>
            <button
              type="button"
              className="btn-pill-outline"
              onClick={() => onNavigate('registration')}
            >
              Sign up
            </button>
          </div>
        )}

        {currentScreen === 'registration' && (
          <div className="header-auth-prompt">
            <span className="prompt-text">Already registered?</span>
            <button
              type="button"
              className="btn-pill-outline"
              onClick={() => onNavigate('signin')}
            >
              Sign in
            </button>
          </div>
        )}

        {currentScreen === 'verification' && (
          <div className="header-auth-prompt">
            <button
              type="button"
              className="btn-pill-outline"
              onClick={() => onNavigate('signin')}
            >
              Back to Sign in
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
