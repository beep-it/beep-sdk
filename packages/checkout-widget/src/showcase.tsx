import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckoutWidget } from './CheckoutWidget';

const ShowcasePage: React.FC = () => {
  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333',
        }}
      >
        BEEP Merchant Widget Showcase
      </h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
        }}
      >
        {/* Default Theme */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px', color: '#666' }}>Default Theme</h3>
          <CheckoutWidget
            amount={25.99}
            primaryColor="#007bff"
            labels={{
              scanQr: 'Scan with your phone or copy address',
            }}
            assets={[{ assetId: '4975fcd1-0cbf-4396-b9f5-079a61baf99a', quantity: 1 }]}
            apiKey="beep_sk_-axb-Nz13wfxMjYAlIy2PfGOc1lg60F9mhJ6Y9QnYI0"
            serverUrl="http://localhost:4070"
          />
        </div>

        {/* Green Theme */}
        {/*<div style={{ textAlign: 'center' }}>*/}
        {/*  <h3 style={{ marginBottom: '20px', color: '#666' }}>Green Theme</h3>*/}
        {/*  <CheckoutWidget*/}
        {/*    merchantId="demo-merchant-002"*/}
        {/*    amount={15.5}*/}
        {/*    primaryColor="#28a745"*/}
        {/*    labels={{*/}
        {/*      scanQr: 'Pay with QR',*/}
        {/*    }}*/}
        {/*    apiKey="demo-api-key-456"*/}
        {/*    serverUrl="http://localhost:4070"*/}
        {/*  />*/}
        {/*</div>*/}

        {/* Purple Theme */}
        {/*<div style={{ textAlign: 'center' }}>*/}
        {/*  <h3 style={{ marginBottom: '20px', color: '#666' }}>Purple Theme</h3>*/}
        {/*  <CheckoutWidget*/}
        {/*    merchantId="demo-merchant-003"*/}
        {/*    amount={99.99}*/}
        {/*    primaryColor="#6f42c1"*/}
        {/*    labels={{*/}
        {/*      scanQr: 'Quick Pay',*/}
        {/*    }}*/}
        {/*    apiKey="demo-api-key-789"*/}
        {/*    serverUrl="http://localhost:4070"*/}
        {/*  />*/}
        {/*</div>*/}

        {/* Orange Theme */}
        {/*<div style={{ textAlign: 'center' }}>*/}
        {/*  <h3 style={{ marginBottom: '20px', color: '#666' }}>Orange Theme</h3>*/}
        {/*  <CheckoutWidget*/}
        {/*    merchantId="demo-merchant-004"*/}
        {/*    amount={5.0}*/}
        {/*    primaryColor="#fd7e14"*/}
        {/*    labels={{*/}
        {/*      scanQr: 'Scan & Pay',*/}
        {/*    }}*/}
        {/*    apiKey="demo-api-key-abc"*/}
        {/*    serverUrl="http://localhost:4070"*/}
        {/*  />*/}
        {/*</div>*/}
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
  merchantId: string;        // Unique merchant identifier
  amount: number;           // Payment amount in USD
  primaryColor: string;     // Hex color for theming
  labels: {
    scanQr: string;        // Text displayed above QR code
  };
  apiKey: string;          // API key for authentication
  serverUrl?: string;      // Optional server URL (defaults to production)
}`}
        </pre>
      </div>
    </div>
  );
};

// Initialize the showcase page
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ShowcasePage />);
}
