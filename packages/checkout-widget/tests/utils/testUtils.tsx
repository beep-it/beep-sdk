import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement, ReactNode } from 'react';

/**
 * Creates a new QueryClient configured for testing
 * - Disables retries to make tests deterministic
 * - Disables caching to ensure fresh data each test
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Creates a wrapper component with QueryClientProvider for testing hooks
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) {
  const { queryClient, ...renderOptions } = options ?? {};
  const Wrapper = createWrapper(queryClient);

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient ?? createTestQueryClient(),
  };
}

/**
 * Helper to wait for async operations in tests
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Mock props for common components
 */
export const mockPublishableKey = 'beep_pk_test_123456789';
export const mockServerUrl = 'https://api.test.justbeep.it';

export const defaultTestProps = {
  publishableKey: mockPublishableKey,
  serverUrl: mockServerUrl,
};

/**
 * Mock payment setup data for component tests
 */
export const mockPaymentSetupData = {
  qrCode: 'data:image/png;base64,mockQrCode',
  referenceKey: 'test-ref-key-123',
  paymentUrl: 'sui:mock-payment-url',
  paymentLabel: 'Test Payment',
  processedAssets: [{ assetId: 'asset_1', quantity: 1 }],
  totalAmount: 25.5,
  isCashPaymentEligible: true,
  destinationAddress: 'mock-destination-address',
};

/**
 * Type helper for mocked functions
 */
export type MockedFn<T extends (...args: any[]) => any> = jest.MockedFunction<T>;
