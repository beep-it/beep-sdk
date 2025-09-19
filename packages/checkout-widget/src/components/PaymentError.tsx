import React from 'react';
import { cardStyles, mainContentStyles } from '../styles';

interface PaymentErrorProps {
  error?: { message?: string } | null;
  primaryColor?: string;
}

export const PaymentError: React.FC<PaymentErrorProps> = ({ error, primaryColor }) => {
  return (
    <div style={cardStyles({ primaryColor })}>
      <div style={mainContentStyles}>
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#dc3545',
          }}
        >
          ⚠️
        </div>
        <div
          style={{
            color: primaryColor || '#dc3545',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          Payment Error
        </div>
        <div
          style={{
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          {error?.message || 'An error occurred while processing payment'}
        </div>
      </div>
    </div>
  );
};