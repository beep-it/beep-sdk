import React from 'react';

export const PaymentSuccess: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '32px', color: '#10b981' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Successfully Processed</div>
    </div>
  );
};
