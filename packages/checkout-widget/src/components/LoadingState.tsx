import React from 'react';
import { cardStyles, mainContentStyles } from '../styles';

interface LoadingStateProps {
  primaryColor?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ primaryColor }) => {
  return (
    <div style={cardStyles({ primaryColor })}>
      <div style={mainContentStyles}>
        <div
          style={{
            color: primaryColor || '#007bff',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Loading payment...
        </div>
      </div>
    </div>
  );
};
