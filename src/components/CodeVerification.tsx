import React, { useState, useRef, useEffect } from 'react';

interface CodeVerificationProps {
  email: string;
  onVerified: (code: string) => void;
  onResend: () => void;
  isVerifying?: boolean;
}

export const CodeVerification: React.FC<CodeVerificationProps> = ({
  email,
  onVerified,
  onResend,
  isVerifying = false,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    // Focus first empty input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const lastChar = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);

    // Auto focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      onVerified(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    const nextFocusIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();

    if (pasted.length === 6) {
      onVerified(pasted);
    }
  };

  const handleResendClick = () => {
    if (countdown > 0) return;
    setCountdown(45);
    onResend();
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h1 className="verification-heading text-center">We sent you a code</h1>
        <p className="verification-subheading text-center">
          Please enter the verification code sent to your email address
          <br />
          <strong className="verification-email">{email || 'your email'}</strong>
        </p>

        <div className="otp-inputs-row" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="otp-digit-box"
              value={digit}
              placeholder="-"
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isVerifying}
              aria-label={`Verification digit ${idx + 1}`}
            />
          ))}
        </div>

        <div className="verification-divider" />

        <div className="verification-resend-row text-center">
          <span className="resend-text">Didn't get the mail? </span>
          <span className="resend-subtext">Check spam or </span>
          <button
            type="button"
            className="link-btn text-dark font-medium"
            onClick={handleResendClick}
            disabled={countdown > 0 || isVerifying}
          >
            {countdown > 0 ? `resend code (${countdown}s)` : 'send a new code'}
          </button>
        </div>

        {isVerifying && (
          <p className="text-center text-muted" style={{ fontSize: '13.5px' }}>
            Verifying code...
          </p>
        )}
      </div>
    </div>
  );
};
