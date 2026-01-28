import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigurationError } from '../../src/components/ConfigurationError';

describe('ConfigurationError', () => {
  const defaultProps = {
    title: 'Configuration Error',
    message: 'Invalid configuration provided',
  };

  it('renders the title', () => {
    render(<ConfigurationError {...defaultProps} />);

    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
  });

  it('renders the message', () => {
    render(<ConfigurationError {...defaultProps} />);

    expect(screen.getByText('Invalid configuration provided')).toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(
      <ConfigurationError
        title="Custom Title"
        message="Some message"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('displays custom message', () => {
    render(
      <ConfigurationError
        title="Title"
        message="Custom error message here"
      />
    );

    expect(screen.getByText('Custom error message here')).toBeInTheDocument();
  });

  it('applies red color to title', () => {
    render(<ConfigurationError {...defaultProps} />);

    const title = screen.getByText('Configuration Error');
    expect(title).toHaveStyle({ color: '#dc3545' });
  });

  it('applies gray color to message', () => {
    render(<ConfigurationError {...defaultProps} />);

    const message = screen.getByText('Invalid configuration provided');
    expect(message).toHaveStyle({ color: '#6b7280' });
  });

  it('accepts primary color prop', () => {
    render(
      <ConfigurationError
        {...defaultProps}
        primaryColor="#ff0000"
      />
    );

    // Component renders without error
    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
  });
});
