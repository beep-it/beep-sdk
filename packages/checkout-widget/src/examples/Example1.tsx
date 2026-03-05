import React from 'react';
import { CheckoutWidget } from '../CheckoutWidget';

interface Example1Props {
  publishableKey: string;
}

export const Example1: React.FC<Example1Props> = ({ publishableKey }) => {
  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333',
        }}
      >
        Checkout Widget Example
      </h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px', color: '#666' }}>Default Theme</h3>
          <CheckoutWidget
            primaryColor="#007bff"
            labels={{
              scanQr: 'Scan with your phone or copy address',
            }}
            assets={[
              { assetId: '4975fcd1-0cbf-4396-b9f5-079a61baf99a', quantity: 1 },
              {
                name: 'Premium Dog Hug',
                price: '0.50',
                quantity: 1,
                description: 'Some description',
              },
              {
                name: 'Ultra premium Dog Hug',
                price: '55',
                quantity: 1,
                description: 'Some description',
              },
            ]}
            publishableKey={publishableKey}
            serverUrl="http://localhost:4070"
            onPaymentSuccess={(a) => console.log(`PAYMENT SUCCESS: ${a}`)}
            onPaymentError={(a) => console.log(`PAYMENT ERROR: ${a}`)}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: '50px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '50px auto 0',
        }}
      >
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Component Props</h2>
        <pre
          style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '14px',
            overflow: 'auto',
          }}
        >
          {`interface MerchantWidgetProps {
  publishableKey: string;   // Browser-safe publishable key
  primaryColor?: string;    // Hex color for theming
  labels: {
    scanQr: string;        // Text displayed above QR code
    paymentLabel?: string; // Optional label visible in wallets
  };
  assets: Array<
    { assetId: string; quantity: number } |
    { name: string; price: string; quantity?: number; description?: string }
  >;
  serverUrl?: string;      // Optional server URL (defaults to production)
}`}
        </pre>
      </div>
    </div>
  );
};
