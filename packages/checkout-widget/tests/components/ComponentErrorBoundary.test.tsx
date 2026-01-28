import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentErrorBoundary } from '../../src/components/ComponentErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ message?: string }> = ({ message = 'Test error' }) => {
  throw new Error(message);
};

// Component that works normally
const WorkingComponent: React.FC = () => {
  return <div>Working content</div>;
};

describe('ComponentErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ComponentErrorBoundary componentName="TestComponent">
          <div>Child content</div>
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <ComponentErrorBoundary componentName="TestComponent">
          <WorkingComponent />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Working content')).toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('catches the error and renders default fallback with component name', () => {
      render(
        <ComponentErrorBoundary componentName="PaymentPanel">
          <ThrowError />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('PaymentPanel Error')).toBeInTheDocument();
    });

    it('displays error message in fallback', () => {
      render(
        <ComponentErrorBoundary componentName="WalletSection">
          <ThrowError message="Custom error message" />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('WalletSection Error')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      render(
        <ComponentErrorBoundary
          componentName="TestComponent"
          fallback={<div>Custom component error</div>}
        >
          <ThrowError />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Custom component error')).toBeInTheDocument();
      expect(screen.queryByText('TestComponent Error')).not.toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('logs error with component name via getDerivedStateFromError', () => {
      render(
        <ComponentErrorBoundary componentName="TestComponent">
          <ThrowError />
        </ComponentErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Component Error:',
        expect.any(Error)
      );
    });

    it('logs detailed error info in componentDidCatch', () => {
      render(
        <ComponentErrorBoundary componentName="DetailedComponent">
          <ThrowError message="Detailed error" />
        </ComponentErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[DetailedComponent] Component Error:',
        expect.objectContaining({
          error: 'Detailed error',
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('scoped error handling', () => {
    it('does not affect siblings outside the boundary', () => {
      render(
        <div>
          <div>Unaffected sibling</div>
          <ComponentErrorBoundary componentName="FailingComponent">
            <ThrowError />
          </ComponentErrorBoundary>
          <div>Another sibling</div>
        </div>
      );

      expect(screen.getByText('Unaffected sibling')).toBeInTheDocument();
      expect(screen.getByText('Another sibling')).toBeInTheDocument();
      expect(screen.getByText('FailingComponent Error')).toBeInTheDocument();
    });

    it('allows multiple boundaries to handle errors independently', () => {
      render(
        <div>
          <ComponentErrorBoundary componentName="First">
            <ThrowError message="First error" />
          </ComponentErrorBoundary>
          <ComponentErrorBoundary componentName="Second">
            <WorkingComponent />
          </ComponentErrorBoundary>
        </div>
      );

      expect(screen.getByText('First Error')).toBeInTheDocument();
      expect(screen.getByText('First error')).toBeInTheDocument();
      expect(screen.getByText('Working content')).toBeInTheDocument();
    });
  });

  describe('default fallback UI', () => {
    it('uses red error styling', () => {
      const { container } = render(
        <ComponentErrorBoundary componentName="StyledComponent">
          <ThrowError />
        </ComponentErrorBoundary>
      );

      // The error container should be present with error styling
      expect(screen.getByText('StyledComponent Error')).toBeInTheDocument();
    });

    it('shows default message when error has no message', () => {
      // Error with empty message
      const EmptyErrorComponent: React.FC = () => {
        throw new Error('');
      };

      render(
        <ComponentErrorBoundary componentName="EmptyError">
          <EmptyErrorComponent />
        </ComponentErrorBoundary>
      );

      // Falls back to default message
      expect(screen.getByText('Component failed to render')).toBeInTheDocument();
    });
  });

  describe('componentName prop', () => {
    it('uses componentName in error title', () => {
      render(
        <ComponentErrorBoundary componentName="CustomName">
          <ThrowError />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('CustomName Error')).toBeInTheDocument();
    });

    it('handles special characters in componentName', () => {
      render(
        <ComponentErrorBoundary componentName="Component/With/Path">
          <ThrowError />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Component/With/Path Error')).toBeInTheDocument();
    });
  });
});
