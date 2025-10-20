import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { styles } from './EmailVerification.styles';
import { WidgetSteps } from '../constants';

export const CodeConfirmation: React.FC<{
  setWidgetStep: (step: WidgetSteps) => void;
  publishableKey: string;
}> = ({ setWidgetStep, publishableKey }) => {
  const [code, setCode] = useState('');
  const [timeUntilResend, setTimeUntilResend] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [codeError, setCodeError] = useState('');

  // Countdown timer for resend button
  useEffect(() => {
    if (timeUntilResend > 0) {
      const timer = setTimeout(() => {
        setTimeUntilResend(timeUntilResend - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [timeUntilResend]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, ''); // Only allow digits
      if (value.length <= 6) {
        setCode(value);
      }

      // Clear error when user starts typing
      if (codeError) {
        setCodeError('');
      }
    },
    [codeError],
  );

  const handleResend = useCallback(async () => {
    // TODO: Implement resend verification code logic
    console.log('Resending verification code...');

    // Reset timer
    setTimeUntilResend(30);
    setIsResendDisabled(true);
  }, []);

  const handleContinue = useCallback(async () => {
    if (code.length !== 6) {
      return;
    }

    try {
      // TODO: Implement code verification logic
      console.log('Verifying code:', code);

      // Simulate verification - replace with actual API call
      const isValid = false; // Replace with actual verification result

      if (!isValid) {
        setCodeError('Invalid verification code. Please try again.');
        return;
      }

      // If verification successful, navigate to next step
      setWidgetStep(WidgetSteps.CashPaymentQuote);
    } catch (error) {
      setCodeError('Verification failed. Please try again.');
    }
  }, [code, setWidgetStep]);

  const handleBack = useCallback(() => {
    setWidgetStep(WidgetSteps.EmailVerification);
  }, [setWidgetStep]);

  const isContinueDisabled = useMemo(() => code.length !== 6, [code]);

  return (
    <div style={styles.container}>
      <style>{`
        .back-button:hover {
          color: #111827 !important;
        }
        .resend-button:not(:disabled):hover {
          color: #1f2937 !important;
        }
        .continue-button:not(:disabled):hover {
          background: linear-gradient(to right, #9333ea, #db2777) !important;
          transform: scale(1.02) !important;
        }
        .continue-button:not(:disabled):active {
          transform: scale(0.98) !important;
        }
      `}</style>

      <button
        onClick={handleBack}
        style={styles.backButton}
        className="back-button"
        aria-label="Go back"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <h2 style={styles.title}>Confirm your email</h2>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Enter 6-digit code</label>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={handleCodeChange}
          placeholder="000000"
          style={{
            ...styles.input,
            textAlign: 'center',
            fontSize: '24px',
            letterSpacing: '8px',
            fontWeight: '600',
            ...(codeError ? { borderColor: '#ef4444' } : {}),
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = codeError ? '#ef4444' : '#a855f7';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = codeError ? '#ef4444' : '#d1d5db';
          }}
        />
        {codeError && <span style={styles.errorText}>{codeError}</span>}
      </div>

      <button
        onClick={handleResend}
        disabled={isResendDisabled}
        style={{
          background: 'none',
          border: 'none',
          color: isResendDisabled ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          cursor: isResendDisabled ? 'not-allowed' : 'pointer',
          padding: '8px',
          textAlign: 'center',
          transition: 'color 0.2s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        className="resend-button"
      >
        {isResendDisabled ? `Resend code in ${timeUntilResend}s` : 'Resend code'}
      </button>

      <button
        onClick={handleContinue}
        disabled={isContinueDisabled}
        style={{
          ...styles.button,
          ...(isContinueDisabled ? styles.buttonDisabled : {}),
        }}
        className="continue-button"
      >
        Continue
      </button>
    </div>
  );
};
