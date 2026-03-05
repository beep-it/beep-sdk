import React, { useCallback, useMemo, useState } from 'react';
import validator from 'validator';
import { styles } from './EmailVerification.styles';
import { WidgetSteps } from '../constants';
import { useGenerateOTP } from '../hooks/useGenerateOTP';

export const EmailVerification: React.FC<{
  email: string;
  setEmail: (email: string) => void;
  tosAccepted: boolean;
  setTosAccepted: (accepted: boolean) => void;
  setWidgetStep: (step: WidgetSteps) => void;
  setOTP: (otp: string | null) => void;
  publishableKey: string;
  serverUrl?: string;
}> = ({
  email,
  setEmail,
  tosAccepted,
  setTosAccepted,
  setWidgetStep,
  setOTP,
  publishableKey,
  serverUrl,
}) => {
  const [emailError, setEmailError] = useState('');

  const { generateOTP, isPending: isGenerateOTPPending } = useGenerateOTP({
    publishableKey,
    serverUrl,
  });

  const validateEmail = (emailValue: string): boolean => {
    return validator.isEmail(emailValue);
  };

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEmail(value);

      // Clear error when user starts typing
      if (emailError) {
        setEmailError('');
      }
    },
    [emailError],
  );

  const handleEmailBlur = useCallback(() => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  }, [email]);

  const handleContinue = useCallback(async () => {
    if (!email || !tosAccepted) {
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const result = await generateOTP({ email, tosAccepted });
    if (result.newCodeGenerated && result.verificationCode) {
      setOTP(result.verificationCode);
    }
    setWidgetStep(WidgetSteps.CodeConfirmation);
  }, [email, tosAccepted]);

  const isButtonDisabled = useMemo(
    () => !email || !tosAccepted || !validateEmail(email) || isGenerateOTPPending,
    [email, tosAccepted, isGenerateOTPPending],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    setWidgetStep(WidgetSteps.PaymentInterface);
  }, [setWidgetStep]);

  return (
    <div style={styles.container}>
      <style>{`
        .back-button:hover {
          color: #111827 !important;
        }
        .link-button:hover {
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
      <h2 style={styles.title}>Verify your email</h2>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Email address</label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="you@example.com"
          style={{
            ...styles.input,
            ...(emailError ? { borderColor: '#ef4444' } : {}),
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = emailError ? '#ef4444' : '#a855f7';
          }}
        />
        {emailError && <span style={styles.errorText}>{emailError}</span>}
      </div>

      <div style={styles.tosContainer}>
        <label style={styles.tosLabel}>
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.tosText}>
            By signing in you agree to Beep's{' '}
            <button
              onClick={() => window.open('https://justbeep.it/termsofservice', '_blank')}
              style={styles.link}
              className="link-button"
            >
              Terms & conditions
            </button>{' '}
            and{' '}
            <button
              onClick={() => window.open('https://justbeep.it/privacypolicy', '_blank')}
              style={styles.link}
              className="link-button"
            >
              Privacy policy
            </button>
          </span>
        </label>
      </div>

      <button
        onClick={handleContinue}
        disabled={isButtonDisabled}
        style={{
          ...styles.button,
          ...(isButtonDisabled ? styles.buttonDisabled : {}),
        }}
        className="continue-button"
      >
        Continue
      </button>
    </div>
  );
};
