import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DynamicWalletProvider } from '../../src/components/DynamicWalletProvider';
import { createWrapper } from '../utils/testUtils';

// Mocks are configured via moduleNameMapper in jest.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('DynamicWalletProvider', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.getDynamicEnv.mockResolvedValue({ environmentId: 'env-123' });
  });

  it('renders children when loading', () => {
    // Make the hook stay in loading state
    __mockWidget.getDynamicEnv.mockImplementation(() => new Promise(() => {}));

    render(
      <DynamicWalletProvider {...defaultProps}>
        <div>Child content</div>
      </DynamicWalletProvider>,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders children when environment ID is loaded', async () => {
    render(
      <DynamicWalletProvider {...defaultProps}>
        <div>Loaded child</div>
      </DynamicWalletProvider>,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('Loaded child')).toBeInTheDocument();
    });
  });

  it('fetches environment ID from API', async () => {
    render(
      <DynamicWalletProvider {...defaultProps}>
        <div>Test</div>
      </DynamicWalletProvider>,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(__mockWidget.getDynamicEnv).toHaveBeenCalled();
    });
  });

  it('renders children when environment ID is missing', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    __mockWidget.getDynamicEnv.mockResolvedValue({ environmentId: null });

    render(
      <DynamicWalletProvider {...defaultProps}>
        <div>Fallback child</div>
      </DynamicWalletProvider>,
      { wrapper: createWrapper() },
    );

    // Children should still render even without environment ID
    await waitFor(() => {
      expect(screen.getByText('Fallback child')).toBeInTheDocument();
    });
  });

  it('renders children when fetch fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    __mockWidget.getDynamicEnv.mockRejectedValue(new Error('API error'));

    render(
      <DynamicWalletProvider {...defaultProps}>
        <div>Error child</div>
      </DynamicWalletProvider>,
      { wrapper: createWrapper() },
    );

    // Children should still render even on error
    await waitFor(() => {
      expect(screen.getByText('Error child')).toBeInTheDocument();
    });
  });
});
