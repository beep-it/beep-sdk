import React from 'react';
import { cardStyles, mainContentStyles } from '../styles';

interface ConfigurationErrorProps {
  title: string;
  message: string;
  primaryColor?: string;
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({
  title,
  message,
  primaryColor,
}) => {
  return (
    <div style={cardStyles({ primaryColor })}>
      <div style={mainContentStyles}>
        <div
          style={{
            color: '#dc3545',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
};
