import { BeepClient } from '@beep/sdk-core';
import React, { useEffect, useState } from 'react';
import { MerchantWidgetProps, MerchantWidgetState } from './types';
import QRCode from 'react-qr-code';
import beepLogo from './beep_logo_mega.svg';

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
        if (response!.referenceKey) {
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
    color: primaryColor,
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
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

  const cardStyles = {
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

  const mainContentStyles = {
    padding: '48px 32px',
    textAlign: 'center',
  };

  const labelStyles = {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '8px',
    fontWeight: '400',
  };

  const amountStyles = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0',
  };

  const footerStyles = {
    backgroundColor: '#f9fafb',
    padding: '16px 24px',
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6',
  };

  const footerContentStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const poweredByTextStyles = {
    color: '#9ca3af',
    fontSize: '14px',
  };

  const logoContainerStyles = {
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
          <div style={labelStyle}>{labels.scanQr}</div>
          {state.paymentUrl && (
            <div style={qrStyle}>
              <QRCode value={state.paymentUrl} size={200} />
            </div>
          )}
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
