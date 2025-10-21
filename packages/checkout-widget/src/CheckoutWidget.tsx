import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ConfigurationError,
  LoadingState,
  PaymentError,
  PaymentSuccess,
  WalletAddressLabel,
} from './components';
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
import { WidgetSteps } from './constants';
import { EmailVerification } from './components/EmailVerification';
import { CodeConfirmation } from './components/CodeConfirmation';

const beepLogo =
  beepLogoUrl ||
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCA0MCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHRleHQgeD0iMCIgeT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMzMzMyI+QkVFUDwvdGV4dD4KPHN2Zz4K';

/**
 * Parses a Payment URI to extract payment parameters.
 * Expected format: solana:recipient?amount=X&reference=Y&label=Z
 */
function parsePaymentURI(uri: string) {
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
 * CheckoutWidget - A complete Solana payment interface for the BEEP payment system
 *
 * This widget provides a full checkout experience supporting both existing product
 * references and on-the-fly product creation. It handles the complete payment flow
 * from product pricing calculation through payment confirmation.
 *
 * Key Features:
 * - Asset-based pricing with automatic total calculation
 * - Solana Pay QR code generation with custom labels
 * - Real-time payment status polling (15-second intervals)
 * - Support for mixed asset types (existing + on-the-fly products)
 * - Comprehensive error handling with isolated error boundaries
 * - Responsive design with customizable theming
 * - Zero CSS dependencies (inline styles prevent conflicts)
 *
 * Payment Flow:
 * 1. Setup: Processes assets, calculates totals, generates Solana Pay URL
 * 2. Display: Shows QR code, amount, and wallet address to user
 * 3. Poll: Continuously monitors payment status every 15 seconds
 * 4. Complete: Displays success state when payment confirmed on-chain
 *
 * Usage (browser-safe with publishable key):
 *
 * @example
 * ```tsx
 * <CheckoutWidget
 *   publishableKey="beep_pk_..."
 *   primaryColor="#007bff"
 *   labels={{ scanQr: 'Scan to Pay', paymentLabel: 'My Store' }}
 *   assets={[
 *     { assetId: 'product-uuid', quantity: 2 },
 *     { name: 'Rush Delivery', price: '15.00', quantity: 1 }
 *   ]}
 *   serverUrl="https://api.justbeep.it" // optional override
 * />
 * ```
 *
 * Notes:
 * - This widget calls the public, CORS-open widget endpoints via the SDK (no secret keys).
 * - Items with { name, price } are created server-side as products (persisted for audit/reuse).
 */
const CheckoutWidgetInner: React.FC<MerchantWidgetProps> = ({
  primaryColor = '#007bff',
  labels = { scanQr: 'Scan with your phone or copy address', paymentLabel: 'Beep Checkout' },
  publishableKey,
  serverUrl,
  assets = [],
}) => {
  // Input validation
  if (!publishableKey || typeof publishableKey !== 'string') {
    console.error('[CheckoutWidget] Missing or invalid publishable key:', publishableKey);
    return (
      <ConfigurationError
        title="Configuration Error"
        message="Publishable key is required"
        primaryColor={primaryColor}
      />
    );
  }

  if (!Array.isArray(assets) || assets.length === 0) {
    return (
      <ConfigurationError
        title="Configuration Error"
        message="At least one asset is required"
        primaryColor={primaryColor}
      />
    );
  }
  // Setup query - runs once to create products and generate QR code
  const {
    data: paymentSetupData,
    error: paymentSetupError,
    isLoading: paymentSetupLoading,
  } = usePaymentSetup({
    assets,
    publishableKey,
    serverUrl,
    paymentLabel: labels?.paymentLabel,
  });

  // Status query - polls for payment completion
  const {
    data: paymentStatusData,
    error: paymentStatusError,
    isLoading: paymentStatusLoading,
  } = usePaymentStatus({
    referenceKey: paymentSetupData?.referenceKey || null,
    publishableKey,
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
      const parsed = parsePaymentURI(paymentSetupData.paymentUrl);
      return parsed?.recipient || '';
    } catch (error) {
      console.error('Error parsing recipient wallet:', error);
      return '';
    }
  }, [paymentSetupData?.paymentUrl]);

  const [email, setEmail] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [widgetStep, setWidgetStep] = useState<WidgetSteps>(WidgetSteps.PaymentInterface);
  const [otp, setOTP] = useState<string | null>(null);

  const handlePayWithCash = useCallback(() => {
    setWidgetStep(WidgetSteps.EmailVerification);
  }, []);

  const shouldRenderAmountDisplay = useMemo(() => {
    return (
      widgetStep === WidgetSteps.PaymentInterface ||
      widgetStep === WidgetSteps.PaymentSuccess ||
      widgetStep === WidgetSteps.PaymentFailure
    );
  }, [widgetStep]);

  if (isLoading) {
    return <LoadingState primaryColor={primaryColor} />;
  }

  if (paymentError) {
    return <PaymentError error={paymentError} primaryColor={primaryColor} />;
  }

  return (
    <ComponentErrorBoundary componentName="TopLevel">
      <div style={cardStyles({ primaryColor })}>
        {/* Amount Display Section */}
        {shouldRenderAmountDisplay && (
          <ComponentErrorBoundary componentName="AmountDisplay">
            <div style={mainContentStyles}>
              <p style={labelStyles}>Amount due</p>
              <h1 style={amountStyles}>${totalAmount > 0 ? totalAmount.toFixed(2) : '...'}</h1>
            </div>
          </ComponentErrorBoundary>
        )}
        {/* Payment Success Section */}
        {isPaymentComplete && (
          <ComponentErrorBoundary componentName="PaymentSuccess">
            <PaymentSuccess />
          </ComponentErrorBoundary>
        )}
        {/* Payment Interface Section */}
        {widgetStep === WidgetSteps.PaymentInterface && (
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
                {paymentSetupData.isCashPaymentEligible && (
                  <ComponentErrorBoundary componentName="Pay with cash">
                    <div style={{ margin: '30px auto 32px auto' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '80%',
                          margin: '20px auto',
                        }}
                      >
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#d3d3d3' }}></div>
                        <span
                          style={{
                            padding: '0 16px',
                            color: '#999',
                            fontSize: '14px',
                            fontWeight: '500',
                          }}
                        >
                          OR
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#d3d3d3' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <button
                          onClick={handlePayWithCash}
                          style={{
                            width: '80%',
                            background: 'linear-gradient(to right, #a855f7, #ec4899)',
                            color: 'white',
                            fontWeight: '600',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              'linear-gradient(to right, #9333ea, #db2777)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              'linear-gradient(to right, #a855f7, #ec4899)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                        >
                          Pay with cash
                        </button>
                      </div>
                    </div>
                  </ComponentErrorBoundary>
                )}
              </>
            )}
          </ComponentErrorBoundary>
        )}
        {widgetStep === WidgetSteps.EmailVerification && (
          <ComponentErrorBoundary componentName="EmailVerification">
            <EmailVerification
              email={email}
              setEmail={setEmail}
              tosAccepted={tosAccepted}
              setTosAccepted={setTosAccepted}
              setWidgetStep={setWidgetStep}
              setOTP={setOTP}
              publishableKey={publishableKey}
              serverUrl={serverUrl}
            />
          </ComponentErrorBoundary>
        )}
        {widgetStep === WidgetSteps.CodeConfirmation && (
          <ComponentErrorBoundary componentName="CodeConfirmation">
            <CodeConfirmation
              email={email}
              tosAccepted={tosAccepted}
              otp={otp}
              setOTP={setOTP}
              setWidgetStep={setWidgetStep}
              publishableKey={publishableKey}
              serverUrl={serverUrl}
            />
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

/**
 * CheckoutWidget - Complete Solana payment interface for BEEP merchants
 *
 * A React component that provides a complete Solana-based payment interface with QR code generation,
 * payment status tracking, and customizable theming. Supports both existing product references and
 * dynamic product creation with automatic total calculation.
 *
 * @example
 * ```tsx
 * import { CheckoutWidget } from '@beep-it/checkout-widget';
 *
 * function PaymentPage() {
 *   return (
 *     <CheckoutWidget
 *       apiKey="beep_live_your_api_key"
 *       primaryColor="#3b82f6"
 *       labels={{
 *         scanQr: "Scan to complete your purchase",
 *         paymentLabel: "Coffee Shop Downtown"
 *       }}
 *       assets={[
 *         {
 *           assetId: "coffee-product-uuid",
 *           quantity: 2,
 *           name: "Premium Espresso"
 *         }
 *       ]}
 *       serverUrl="https://your-beep-server.com"
 *     />
 *   );
 * }
 * ```
 *
 * @param props - Configuration for the checkout widget
 * @param props.apiKey - BEEP API key for merchant authentication
 * @param props.primaryColor - Hex color for theming widget elements
 * @param props.labels - Customizable text labels for the interface
 * @param props.assets - Array of products/services to purchase
 * @param props.serverUrl - Optional custom BEEP server URL
 *
 * @returns A fully functional Solana payment widget with QR code and status tracking
 */
export const CheckoutWidget: React.FC<MerchantWidgetProps> = (props) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <CheckoutWidgetInner {...props} />
      </QueryProvider>
    </ErrorBoundary>
  );
};
