import { renderHook, waitFor, act } from '@testing-library/react';
import { useGeneratePaymentQuote } from '../../src/hooks/useGeneratePaymentQuote';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('useGeneratePaymentQuote', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
    amount: '25.50',
    walletAddress: 'wallet-address-123',
    payWayCode: 'VISA_MASTER_CARD' as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.generatePaymentQuote.mockResolvedValue({
      fiatAmount: '26.50',
      networkFee: '0.50',
      rampFee: '0.50',
      supportedPaymentMethods: [
        {
          country: 'US',
          payWayCode: 'VISA_MASTER_CARD',
          minPurchaseAmount: '10.00',
          maxPurchaseAmount: '1000.00',
        },
      ],
    });
  });

  describe('basic functionality', () => {
    it('fetches payment quote when amount and walletAddress are provided', async () => {
      const { result } = renderHook(() => useGeneratePaymentQuote(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.generatePaymentQuote).toHaveBeenCalledWith({
        amount: '25.50',
        walletAddress: 'wallet-address-123',
        payWayCode: 'VISA_MASTER_CARD',
      });
      expect(result.current.data).toEqual({
        fiatAmount: '26.50',
        networkFee: '0.50',
        rampFee: '0.50',
        supportedPaymentMethods: [
          {
            country: 'US',
            payWayCode: 'VISA_MASTER_CARD',
            minPurchaseAmount: '10.00',
            maxPurchaseAmount: '1000.00',
          },
        ],
      });
    });

    it('does not fetch when amount is empty', async () => {
      const { result } = renderHook(
        () => useGeneratePaymentQuote({ ...defaultProps, amount: '' }),
        { wrapper: createWrapper() },
      );

      // Give some time for any potential fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(__mockWidget.generatePaymentQuote).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('does not fetch when walletAddress is empty', async () => {
      const { result } = renderHook(
        () => useGeneratePaymentQuote({ ...defaultProps, walletAddress: '' }),
        { wrapper: createWrapper() },
      );

      // Give some time for any potential fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(__mockWidget.generatePaymentQuote).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('polling behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('refetches every 15 seconds', async () => {
      const { result } = renderHook(() => useGeneratePaymentQuote(defaultProps), {
        wrapper: createWrapper(),
      });

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = __mockWidget.generatePaymentQuote.mock.calls.length;

      // Advance time by 15 seconds
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      // Should have made another call
      await waitFor(() => {
        expect(__mockWidget.generatePaymentQuote.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });
  });

  describe('query key', () => {
    it('creates unique query key based on parameters', async () => {
      const wrapper = createWrapper();

      const { result: result1 } = renderHook(
        () => useGeneratePaymentQuote({ ...defaultProps, amount: '10.00' }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(
        () => useGeneratePaymentQuote({ ...defaultProps, amount: '20.00' }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Each unique parameter combination should trigger a separate API call
      expect(__mockWidget.generatePaymentQuote).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '10.00' }),
      );
      expect(__mockWidget.generatePaymentQuote).toHaveBeenCalledWith(
        expect.objectContaining({ amount: '20.00' }),
      );
    });
  });

  describe('response data', () => {
    it('returns fiatAmount from response', async () => {
      __mockWidget.generatePaymentQuote.mockResolvedValue({
        fiatAmount: '100.50',
        networkFee: '1.00',
        rampFee: '2.00',
        supportedPaymentMethods: [],
      });

      const { result } = renderHook(() => useGeneratePaymentQuote(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.fiatAmount).toBe('100.50');
      expect(result.current.data?.networkFee).toBe('1.00');
      expect(result.current.data?.rampFee).toBe('2.00');
    });

    it('returns supportedPaymentMethods', async () => {
      const paymentMethods = [
        {
          country: 'US',
          payWayCode: 'VISA_MASTER_CARD',
          minPurchaseAmount: '10.00',
          maxPurchaseAmount: '1000.00',
        },
        {
          country: 'US',
          payWayCode: 'APPLE_PAY',
          minPurchaseAmount: '5.00',
          maxPurchaseAmount: '500.00',
        },
      ];

      __mockWidget.generatePaymentQuote.mockResolvedValue({
        fiatAmount: '50.00',
        networkFee: '0.50',
        rampFee: '1.00',
        supportedPaymentMethods: paymentMethods,
      });

      const { result } = renderHook(() => useGeneratePaymentQuote(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.supportedPaymentMethods).toHaveLength(2);
      expect(result.current.data?.supportedPaymentMethods[0].payWayCode).toBe('VISA_MASTER_CARD');
      expect(result.current.data?.supportedPaymentMethods[1].payWayCode).toBe('APPLE_PAY');
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      __mockWidget.generatePaymentQuote.mockRejectedValue(new Error('Quote generation failed'));

      const { result } = renderHook(() => useGeneratePaymentQuote(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.data).toBeUndefined();
    });
  });
});
