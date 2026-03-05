import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingState } from '../../src/components/LoadingState';

describe('LoadingState', () => {
  it('renders loading message', () => {
    render(<LoadingState />);

    expect(screen.getByText('Loading payment...')).toBeInTheDocument();
  });

  it('uses default blue color when no primary color provided', () => {
    render(<LoadingState />);

    const loadingText = screen.getByText('Loading payment...');
    expect(loadingText).toHaveStyle({ color: '#007bff' });
  });

  it('uses primary color when provided', () => {
    render(<LoadingState primaryColor="#ff5500" />);

    const loadingText = screen.getByText('Loading payment...');
    expect(loadingText).toHaveStyle({ color: '#ff5500' });
  });

  it('applies bold font weight', () => {
    render(<LoadingState />);

    const loadingText = screen.getByText('Loading payment...');
    expect(loadingText).toHaveStyle({ fontWeight: 'bold' });
  });
});
