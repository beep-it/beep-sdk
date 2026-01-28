import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentError } from '../../src/components/PaymentError';

describe('PaymentError', () => {
  it('renders error emoji', () => {
    render(<PaymentError />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('renders error title', () => {
    render(<PaymentError />);

    expect(screen.getByText('Payment Error')).toBeInTheDocument();
  });

  it('displays custom error message', () => {
    render(<PaymentError error={{ message: 'Custom error occurred' }} />);

    expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
  });

  it('displays default error message when no error provided', () => {
    render(<PaymentError />);

    expect(screen.getByText('An error occurred while processing payment')).toBeInTheDocument();
  });

  it('displays default error message when error has no message', () => {
    render(<PaymentError error={{}} />);

    expect(screen.getByText('An error occurred while processing payment')).toBeInTheDocument();
  });

  it('displays default error message when error is null', () => {
    render(<PaymentError error={null} />);

    expect(screen.getByText('An error occurred while processing payment')).toBeInTheDocument();
  });

  it('uses primary color when provided', () => {
    const primaryColor = '#ff5500';
    const { container } = render(<PaymentError primaryColor={primaryColor} />);

    // The title should have the primary color
    const title = screen.getByText('Payment Error');
    expect(title).toHaveStyle({ color: primaryColor });
  });

  it('uses default error color when no primary color', () => {
    render(<PaymentError />);

    // The title should have the default error color
    const title = screen.getByText('Payment Error');
    expect(title).toHaveStyle({ color: '#dc3545' });
  });
});
