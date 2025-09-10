import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ConfigurationError, LoadingState, PaymentError, PaymentSuccess, WalletAddressLabel } from './components';
import { ComponentErrorBoundary } from './components/ComponentErrorBoundary';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePaymentSetup, usePaymentStatus } from './hooks';
import { QueryProvider } from './QueryProvider';
import {
  amountStyles,
  cardStyles,
  footerContentStyles,
  footerStyles,
  labelStyle,
  labelStyles,
  logoContainerStyles,
  mainContentStyles,
  poweredByTextStyles,
  qrStyle,
} from './styles';
import { MerchantWidgetProps } from './types';

// Safe logo import with fallback
import beepLogoUrl from './beep_logo_mega.svg';

const beepLogo =
  beepLogoUrl ||
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA0MCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHRleHQgeD0iMCIgeT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMzMzMyI+QkVFUDwvdGV4dD4KPHN2Zz4K';

/**
 * Parses a Solana Pay URI to extract payment parameters.
 * Expected format: solana:recipient?amount=X&reference=Y&label=Z
 */
function parseSolanaPayURI(uri: string) {
  try {
    if (!uri || typeof uri !== 'string') {
      return {
        recipient: '',
        amount: null,
        splToken: null,
        reference: null,
        label: null,
        message: null,
      };
    }
    const url = new URL(uri);

    return {
      recipient: url.pathname || '',
      amount: url.searchParams.get('amount'),
      splToken: url.searchParams.get('spl-token'),
      reference: url.searchParams.get('reference'),
      label: url.searchParams.get('label'),
      message: url.searchParams.get('message'),
    };
  } catch (error) {
    console.error('Failed to parse Solana Pay URI:', error);
    return {
      recipient: '',
      amount: null,
      splToken: null,
      reference: null,
      label: null,
      message: null,
    };
  }
}

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
const CheckoutWidgetInner: React.FC<MerchantWidgetProps> = ({
  primaryColor = '#007bff',
  labels = { scanQr: 'Scan with your phone or copy address' },
  apiKey,
  serverUrl,
  assets = [],
}) => {
  // Input validation
  if (!apiKey || typeof apiKey !== 'string') {
    console.error('[CheckoutWidget] Missing or invalid API key:', apiKey);
    return <ConfigurationError title="Configuration Error" message="API key is required" primaryColor={primaryColor} />;
  }

  if (!Array.isArray(assets) || assets.length === 0) {
    return (
      <ConfigurationError title="Configuration Error" message="At least one asset is required" primaryColor={primaryColor} />
    );
  }
  // Setup query - runs once to create products and generate QR code
  const {
    data: paymentSetupData,
    error: paymentSetupError,
    isLoading: paymentSetupLoading,
  } = usePaymentSetup({
    assets,
    apiKey,
    serverUrl,
  });

  // Status query - polls for payment completion
  const {
    data: paymentStatusData,
    error: paymentStatusError,
    isLoading: paymentStatusLoading,
  } = usePaymentStatus({
    referenceKey: paymentSetupData?.referenceKey || null,
    processedAssets: paymentSetupData?.processedAssets || [],
    apiKey,
    serverUrl,
    enabled: !!paymentSetupData?.referenceKey,
  });

  // Derive state from queries
  const isLoading = paymentSetupLoading || paymentStatusLoading;
  const paymentError = paymentSetupError || paymentStatusError;
  const isPaymentComplete = Boolean(paymentStatusData === true);

  // Get total amount from payment setup data (calculated from actual product pricing)
  const totalAmount = paymentSetupData?.totalAmount ?? 0;

  // Extract wallet address from Solana Pay URI for display
  const recipientWallet = useMemo(() => {
    try {
      if (!paymentSetupData?.paymentUrl) return '';
      const parsed = parseSolanaPayURI(paymentSetupData.paymentUrl);
      return parsed?.recipient || '';
    } catch (error) {
      console.error('Error parsing recipient wallet:', error);
      return '';
    }
  }, [paymentSetupData?.paymentUrl]);

  if (isLoading) {
    return <LoadingState primaryColor={primaryColor} />;
  }

  if (paymentError) {
    return <PaymentError error={paymentError} primaryColor={primaryColor} />;
  }

  return (
    <ComponentErrorBoundary componentName="TopLevel">
      <div style={cardStyles({ primaryColor })}>
        <ComponentErrorBoundary componentName="AmountDisplay">
          <div style={mainContentStyles}>
            <p style={labelStyles}>Amount due</p>
            <h1 style={amountStyles}>${totalAmount > 0 ? totalAmount.toFixed(2) : '...'}</h1>
          </div>
        </ComponentErrorBoundary>
        {isPaymentComplete ? (
          <ComponentErrorBoundary componentName="PaymentSuccess">
            <PaymentSuccess />
          </ComponentErrorBoundary>
        ) : (
          <ComponentErrorBoundary componentName="PaymentInterface">
            {paymentSetupData && (
              <>
                <ComponentErrorBoundary componentName="InstructionLabel">
                  <div style={labelStyle}>
                    {labels?.scanQr ?? 'Scan with your phone or copy address'}
                  </div>
                </ComponentErrorBoundary>

                {paymentSetupData.paymentUrl && (
                  <ComponentErrorBoundary
                    componentName="QRCodeDisplay"
                    fallback={
                      <div
                        style={{
                          width: '200px',
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          border: '2px dashed #ccc',
                          borderRadius: '8px',
                          color: '#666',
                          fontSize: '14px',
                          margin: '0 auto 32px auto',
                        }}
                      >
                        QR Code Failed
                      </div>
                    }
                  >
                    <div style={qrStyle({ primaryColor })}>
                      {QRCodeSVG ? (
                        <QRCodeSVG value={paymentSetupData.paymentUrl} size={168} />
                      ) : (
                        <div style={{ color: 'red', padding: '20px' }}>
                          QRCode component not available
                        </div>
                      )}
                    </div>
                  </ComponentErrorBoundary>
                )}

                <ComponentErrorBoundary componentName="WalletAddress">
                  <div style={{ margin: '30px auto 32px auto' }}>
                    <WalletAddressLabel walletAddress={recipientWallet} />
                  </div>
                </ComponentErrorBoundary>
              </>
            )}
          </ComponentErrorBoundary>
        )}
        {/* Footer */}
        <ComponentErrorBoundary componentName="Footer">
          <div style={footerStyles}>
            <div style={footerContentStyles}>
              <span style={poweredByTextStyles}>Powered by</span>
              <ComponentErrorBoundary
                componentName="Logo"
                fallback={<span style={{ fontSize: '12px', fontWeight: 'bold' }}>BEEP</span>}
              >
                <div style={logoContainerStyles}>
                  <img
                    src={beepLogo}
                    alt="Beep"
                    style={{ height: '16px', width: 'auto' }}
                    onError={(e) => {
                      console.error('[CheckoutWidget] Logo failed to load:', beepLogo);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.textContent = 'BEEP';
                      fallback.style.fontSize = '12px';
                      fallback.style.fontWeight = 'bold';
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                </div>
              </ComponentErrorBoundary>
            </div>
          </div>
        </ComponentErrorBoundary>
      </div>
    </ComponentErrorBoundary>
  );
};

// Export wrapped version with QueryProvider and ErrorBoundary
export const CheckoutWidget: React.FC<MerchantWidgetProps> = (props) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <CheckoutWidgetInner {...props} />
      </QueryProvider>
    </ErrorBoundary>
  );
};
