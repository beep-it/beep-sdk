import React, { Component, ReactNode } from 'react';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ComponentErrorBoundary extends Component<ComponentErrorBoundaryProps, ComponentErrorBoundaryState> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    console.error(`Component Error:`, error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentName } = this.props;
    console.error(`[${componentName}] Component Error:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
    });
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { componentName, fallback } = this.props;

      if (fallback) {
        return fallback;
      }

      return (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            margin: '8px 0',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '4px',
            }}
          >
            {componentName} Error
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#7f1d1d',
            }}
          >
            {this.state.error?.message || 'Component failed to render'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}