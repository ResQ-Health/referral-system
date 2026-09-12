import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SignInProps {
  onSignInSuccess: (email: string, password?: string) => void;
  onNavigateToRegister: () => void;
  onGoogleSignIn: () => void;
  isLoading?: boolean;
}

export const SignIn: React.FC<SignInProps> = ({
  onSignInSuccess,
  onNavigateToRegister,
  onGoogleSignIn,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    onSignInSuccess(email, password);
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
        <h1 className="auth-heading text-center" style={{ marginBottom: '6px' }}>Welcome back</h1>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginBottom: '22px' }}>
          Sign in to your clinician account to manage referrals & requisitions
        </p>

        <button
          type="button"
          onClick={onGoogleSignIn}
          className="btn-google-pill"
          id="google-signin-btn"
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.39 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider">
          <span className="divider-label">or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="input-pill"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. Joshuanasiru@yandex.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-pill-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="input-pill input-with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="forgot-password-row">
            <button
              type="button"
              className="link-btn text-muted"
              onClick={() => alert('Password reset link will be sent to ' + (email || 'your email'))}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-pill-primary w-full"
            id="signin-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="mobile-signup-prompt">
            <span className="text-muted">No account? </span>
            <button
              type="button"
              className="link-btn text-dark font-medium"
              onClick={onNavigateToRegister}
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
