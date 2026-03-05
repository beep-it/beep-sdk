import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CheckoutWidget Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            minWidth: '300px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
                color: '#dc3545',
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#dc3545',
                margin: '0 0 8px 0',
              }}
            >
              Payment Widget Error
            </h2>
            <p
              style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: '0',
                lineHeight: '1.5',
              }}
            >
              Something went wrong with the payment widget. Please refresh the page or contact
              support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
