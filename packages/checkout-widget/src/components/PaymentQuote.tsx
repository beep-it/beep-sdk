import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { styles } from './EmailVerification.styles';
import { PAY_WAY_CODE_LABELS, PAY_WAY_CODE_LOGOS, WidgetSteps } from '../constants';
import { useGeneratePaymentQuote } from '../hooks/useGeneratePaymentQuote';
import { PayWayCode } from '../../../core/src/types/cash-payment';
import { useCreateCashPaymentOrder } from '../hooks/useCreateCashPaymentOrder';

const QUOTE_REFRESH_INTERVAL = 15; // 15 seconds

export const PaymentQuote: React.FC<{
  reference: string;
  email: string;
  amount: string;
  walletAddress: string;
  setWidgetStep: (step: WidgetSteps) => void;
  publishableKey: string;
  serverUrl?: string;
}> = ({ reference, email, amount, walletAddress, setWidgetStep, publishableKey, serverUrl }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayWayCode>(
    PayWayCode.VISA_MASTER_CARD,
  );
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(QUOTE_REFRESH_INTERVAL);

  const {
    data,
    isLoading,
    error,
    refetch: refetchQuote,
  } = useGeneratePaymentQuote({
    publishableKey,
    serverUrl,
    amount,
    walletAddress,
    payWayCode: selectedPaymentMethod,
  });

  const { createCashPaymentOrder, isPending: isCreatingOrder } = useCreateCashPaymentOrder({
    publishableKey,
    serverUrl,
  });

  // Countdown timer for quote refresh
  useEffect(() => {
    if (timeUntilRefresh > 0) {
      const timer = setTimeout(() => {
        setTimeUntilRefresh(timeUntilRefresh - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-refetch when timer hits 0
      refetchQuote();
      setTimeUntilRefresh(QUOTE_REFRESH_INTERVAL);
    }
  }, [timeUntilRefresh, refetchQuote]);

  // Reset timer when payment method changes
  useEffect(() => {
    setTimeUntilRefresh(QUOTE_REFRESH_INTERVAL);
  }, [selectedPaymentMethod]);

  const handlePaymentMethodChange = useCallback((payWayCode: PayWayCode) => {
    setSelectedPaymentMethod(payWayCode);
  }, []);

  const handleBack = useCallback(() => {
    setWidgetStep(WidgetSteps.CodeConfirmation);
  }, [setWidgetStep]);

  const handleContinue = useCallback(async () => {
    // Check all required data is present just in case
    if (email && walletAddress && reference && selectedPaymentMethod && data?.fiatAmount) {
      const result = await createCashPaymentOrder({
        amount: data.fiatAmount,
        email,
        walletAddress,
        reference,
        payWayCode: selectedPaymentMethod,
      });

      if (result.payUrl) {
        // Redirect to payment URL
        window.location.href = result.payUrl;
      }
    }
  }, [selectedPaymentMethod, data]);

  const isContinueDisabled = useMemo(() => {
    return isLoading || !data?.fiatAmount || isCreatingOrder;
  }, [isLoading, data, isCreatingOrder]);

  return (
    <div style={{ ...styles.container }}>
      <style>{`
        .back-button:hover {
          color: #111827 !important;
        }
        .payment-method-radio:hover {
          border-color: #a855f7 !important;
        }
        .payment-method-radio.selected {
          border-color: #a855f7 !important;
          background-color: #f3e8ff !important;
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

      <h2 style={styles.title}>Pay with cash</h2>

      {/* Prominent Fiat Amount Display */}
      <div
        style={{
          textAlign: 'center',
          margin: '20px 0 32px 0',
        }}
      >
        {isLoading ? (
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#9ca3af',
            }}
          >
            ...
          </div>
        ) : error ? (
          <div
            style={{
              fontSize: '16px',
              color: '#ef4444',
              padding: '12px',
            }}
          >
            Failed to load quote
          </div>
        ) : (
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '36px' }}>$</span>
            <span>{data?.fiatAmount || '0.00'}</span>
          </div>
        )}

        {/* Countdown Timer */}
        <div
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Quote refreshes in {timeUntilRefresh}s</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={styles.inputGroup}>
        <label style={styles.label}>Select payment method</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {data?.supportedPaymentMethods
            ?.filter((method) => {
              const methodLabel = PAY_WAY_CODE_LABELS[method.payWayCode];
              return !!methodLabel;
            })
            .map((paymentLimit) => (
              <label
                key={paymentLimit.payWayCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff',
                }}
                className={`payment-method-radio ${selectedPaymentMethod === paymentLimit.payWayCode ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={paymentLimit.payWayCode}
                  checked={selectedPaymentMethod === paymentLimit.payWayCode}
                  onChange={() => handlePaymentMethodChange(paymentLimit.payWayCode)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    marginRight: '12px',
                    accentColor: '#a855f7',
                  }}
                />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={PAY_WAY_CODE_LOGOS[paymentLimit.payWayCode]}
                    alt={PAY_WAY_CODE_LABELS[paymentLimit.payWayCode]}
                    style={{
                      height: '24px',
                      width: 'auto',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                    }}
                  >
                    {PAY_WAY_CODE_LABELS[paymentLimit.payWayCode]}
                  </div>
                </div>
              </label>
            ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={isContinueDisabled}
        style={{
          ...styles.button,
          ...(isContinueDisabled ? styles.buttonDisabled : {}),
          marginTop: '12px',
        }}
        className="continue-button"
      >
        Continue to checkout
      </button>
    </div>
  );
};
