import { BeepClient } from '@beep-it/sdk-core';
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import beepLogo from './beep_logo_mega.svg';
import { MerchantWidgetProps, MerchantWidgetState } from './types';

/**
 * Parses a Solana Pay URI to extract payment parameters.
 * Expected format: solana:recipient?amount=X&reference=Y&label=Z
 */
function parseSolanaPayURI(uri: string) {
  const url = new URL(uri);

  return {
    recipient: url.pathname,
    amount: url.searchParams.get('amount'),
    splToken: url.searchParams.get('spl-token'),
    reference: url.searchParams.get('reference'),
    label: url.searchParams.get('label'),
    message: url.searchParams.get('message'),
  };
}

const WalletAddressLabel = ({ walletAddress = '0x1234567890121234567890121234567890120611' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) {
      return address;
    }
    return `${address.slice(0, 12)}...${address.slice(-4)}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.labelContainer}>
        <span style={styles.walletLabel}>{truncateAddress(walletAddress)}</span>
        <button
          onClick={handleCopy}
          style={styles.copyButton}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      {copied && <div style={styles.copyFeedback}>Copied to clipboard!</div>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    maxWidth: '240px',
    margin: '20px auto',
  },
  labelContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '20px',
    padding: '12px 16px',
    paddingRight: '48px',
    border: '1px solid #e0e0e0',
    minHeight: '20px',
  },
  walletLabel: {
    flex: 1,
    fontSize: '14px',
    color: '#666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none',
  },
  copyButton: {
    position: 'absolute',
    right: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'background-color 0.2s ease',
  },
  copyFeedback: {
    position: 'absolute',
    top: '-35px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
  },
};

/**
 * CheckoutWidget - A complete Solana payment interface
 *
 * Features:
 * - Generates QR codes for mobile wallet scanning
 * - Shows copyable wallet addresses for desktop users
 * - Polls payment status every 15 seconds
 * - Displays success state when payment is confirmed
 *
 * The widget handles both customer-to-merchant payments via Solana Pay.
 * Styling uses inline styles for easy embedding without CSS conflicts.
 */
export const CheckoutWidget: React.FC<MerchantWidgetProps> = ({
  amount,
  primaryColor,
  labels,
  apiKey,
  serverUrl,
  assets,
}) => {
  const [state, setState] = useState<MerchantWidgetState>({
    qrCode: null,
    loading: true,
    error: null,
    referenceKey: null,
    paymentUrl: null,
    paymentSuccess: false,
  });

  // Initial payment setup - generates QR code and payment URL
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const client = new BeepClient({
          apiKey,
          serverUrl: serverUrl,
        });

        const paymentResponse = await client.payments.requestAndPurchaseAsset({
          assets,
          generateQrCode: true,
        });

        setState({
          qrCode: paymentResponse?.qrCode || null,
          loading: false,
          error: null,
          referenceKey: paymentResponse?.referenceKey || null,
          paymentUrl: paymentResponse?.paymentUrl || null,
          paymentSuccess: false,
        });
      } catch (error) {
        setState({
          qrCode: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load payment data',
          referenceKey: null,
          paymentUrl: null,
          paymentSuccess: false,
        });
      }
    };

    fetchPaymentData();
  }, [amount, apiKey, serverUrl]);

  // Payment status polling - checks every 15 seconds for completion
  useEffect(() => {
    if (!state.referenceKey || state.paymentSuccess) {
      return;
    }

    const pollPaymentStatus = async () => {
      console.log('polling...');
      try {
        const client = new BeepClient({
          apiKey,
          serverUrl: serverUrl,
        });

        const response = await client.payments.requestAndPurchaseAsset({
          assets,
          paymentReference: state.referenceKey!,
          generateQrCode: false,
        });
        if (!response?.referenceKey) {
          setState((prev) => ({ ...prev, paymentSuccess: true }));
          return;
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const interval = setInterval(pollPaymentStatus, 15000);

    return () => clearInterval(interval);
  }, [state.referenceKey, state.paymentSuccess, assets, apiKey, serverUrl]);

  // Extract wallet address from Solana Pay URI for display
  const recepientWallet = useMemo(
    () => (state.paymentUrl ? parseSolanaPayURI(state.paymentUrl)?.recipient : ''),
    [state.paymentUrl],
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    border: `2px solid ${primaryColor}`,
    borderRadius: '8px',
    maxWidth: '300px',
    fontFamily: 'Arial, sans-serif',
  };

  const labelStyle: React.CSSProperties = {
    color: '#96969B',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '16px',
    textAlign: 'center',
    opacity: 0.7,
  };

  const qrStyle: React.CSSProperties = {
    maxWidth: '200px',
    maxHeight: '200px',
    border: '4px solid #373737',
    borderRadius: '17px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px auto',
    padding: '16px',
  };

  const errorStyle: React.CSSProperties = {
    color: '#dc3545',
    fontSize: '14px',
    textAlign: 'center',
  };

  const loadingStyle: React.CSSProperties = {
    color: primaryColor,
    fontSize: '14px',
  };

  const cardStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    minWidth: '300px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const mainContentStyles: React.CSSProperties = {
    padding: '48px 32px',
    textAlign: 'center',
  };

  const labelStyles: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '8px',
    fontWeight: '400',
  };

  const amountStyles: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0',
  };

  const footerStyles: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    padding: '16px 24px',
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6',
  };

  const footerContentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const poweredByTextStyles: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '14px',
  };

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  if (state.loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading payment...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>Error: {state.error}</div>
      </div>
    );
  }

  return (
    <div style={cardStyles}>
      <div style={mainContentStyles}>
        <p style={labelStyles}>Amount due</p>
        <h1 style={amountStyles}>${amount}</h1>
      </div>
      {state.paymentSuccess ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#10b981' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Successfully Processed</div>
        </div>
      ) : (
        <>
          <div style={labelStyle}>{labels.scanQr ?? 'Scan with your phone or copy address'}</div>
          {state.paymentUrl && (
            <div style={qrStyle}>
              <QRCode value={state.paymentUrl} size={200} />
            </div>
          )}
          <div
            style={{
              margin: '30px auto 32px auto',
            }}
          >
            <WalletAddressLabel walletAddress={recepientWallet} />
          </div>
        </>
      )}
      {/* Footer */}
      <div style={footerStyles}>
        <div style={footerContentStyles}>
          <span style={poweredByTextStyles}>Powered by</span>
          <div style={logoContainerStyles}>
            <img src={beepLogo} alt="Beep" className="h-4 w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
