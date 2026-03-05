import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentSuccess } from '../../src/components/PaymentSuccess';

describe('PaymentSuccess', () => {
  it('renders success checkmark', () => {
    render(<PaymentSuccess />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders success message', () => {
    render(<PaymentSuccess />);

    expect(screen.getByText('Payment Successfully Processed')).toBeInTheDocument();
  });

  it('uses green color for success styling', () => {
    const { container } = render(<PaymentSuccess />);

    const successContainer = container.firstChild as HTMLElement;
    expect(successContainer).toHaveStyle({ color: '#10b981' });
  });

  it('centers the content', () => {
    const { container } = render(<PaymentSuccess />);

    const successContainer = container.firstChild as HTMLElement;
    expect(successContainer).toHaveStyle({ textAlign: 'center' });
  });
});
