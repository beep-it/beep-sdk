import React, { useState, useEffect } from 'react';
import { MerchantWidgetProps, MerchantWidgetState } from './types';
import { BeepClient } from '@beep/sdk-core';

export const CheckoutWidget: React.FC<MerchantWidgetProps> = ({
  merchantId,
  amount,
  primaryColor,
  labels,
  apiKey,
  serverUrl,
}) => {
  const [state, setState] = useState<MerchantWidgetState>({
    qrCode: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const client = new BeepClient({
          apiKey,
          serverUrl: serverUrl,
        });

        const paymentResponse = await client.requestPayment({
          amount,
          description: `Payment for merchant ${merchantId}`,
        });

        setState({
          qrCode: paymentResponse.qrCode,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          qrCode: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load payment data',
        });
      }
    };

    fetchPaymentData();
  }, [merchantId, amount, apiKey, serverUrl]);

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
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
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
    <div style={containerStyle}>
      <div style={labelStyle}>{labels.scanQr}</div>
      {state.qrCode && <img src={state.qrCode} alt="QR Code for payment" style={qrStyle} />}
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
        Amount: ${amount.toFixed(2)}
      </div>
    </div>
  );
};
