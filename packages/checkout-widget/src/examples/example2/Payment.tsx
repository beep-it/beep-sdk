import React from 'react';
import { CheckoutWidget } from '../../CheckoutWidget';

interface CartItem {
  assetId: string;
  quantity: number;
}

interface PaymentProps {
  cart: CartItem[];
  publishableKey: string;
  onBackToCart: () => void;
}

export const Payment: React.FC<PaymentProps> = ({ cart, publishableKey, onBackToCart }) => {
  // Convert cart items to assets for CheckoutWidget
  const assets = cart.map((item) => ({
    assetId: item.assetId,
    quantity: item.quantity,
  }));

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
        Payment
      </h2>

      <div
        style={{
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '30px' }}>
          <CheckoutWidget
            publishableKey={publishableKey}
            primaryColor="#007bff"
            labels={{
              scanQr: 'Scan with your phone or copy address',
              paymentLabel: 'My Store Checkout',
            }}
            assets={assets}
            serverUrl="http://localhost:4070"
          />
        </div>

        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '2px solid #ddd' }}>
          <button
            onClick={onBackToCart}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7f8c8d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#95a5a6';
            }}
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
