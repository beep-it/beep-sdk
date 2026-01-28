import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateCashPaymentOrder } from '../../src/hooks/useCreateCashPaymentOrder';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mockWidget } = require('@beep-it/sdk-core');

describe('useCreateCashPaymentOrder', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.createCashPaymentOrder.mockResolvedValue({
      payUrl: 'https://payment.example.com/order/123',
    });
  });

  describe('mutation success', () => {
    it('creates cash payment order successfully', async () => {
      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      expect(result.current.isPending).toBe(false);

      let response: any;
      await act(async () => {
        response = await result.current.createCashPaymentOrder({
          reference: 'ref-123',
          walletAddress: 'wallet-address-123',
          amount: '25.50',
          payWayCode: 'VISA_MASTER_CARD' as any,
          email: 'test@example.com',
        });
      });

      expect(response).toEqual({
        payUrl: 'https://payment.example.com/order/123',
      });
      expect(__mockWidget.createCashPaymentOrder).toHaveBeenCalledWith({
        reference: 'ref-123',
        walletAddress: 'wallet-address-123',
        amount: '25.50',
        payWayCode: 'VISA_MASTER_CARD',
        email: 'test@example.com',
      });
    });

    it('returns payUrl in response', async () => {
      __mockWidget.createCashPaymentOrder.mockResolvedValue({
        payUrl: 'https://custom-payment-gateway.com/checkout/abc',
      });

      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      let response: any;
      await act(async () => {
        response = await result.current.createCashPaymentOrder({
          reference: 'ref-456',
          walletAddress: 'wallet-456',
          amount: '100.00',
          payWayCode: 'APPLE_PAY' as any,
          email: 'user@example.com',
        });
      });

      expect(response.payUrl).toBe('https://custom-payment-gateway.com/checkout/abc');
    });
  });

  describe('mutation error', () => {
    it('rejects on error', async () => {
      const error = new Error('Failed to create order');
      __mockWidget.createCashPaymentOrder.mockRejectedValue(error);

      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      await expect(
        act(async () => {
          await result.current.createCashPaymentOrder({
            reference: 'ref-123',
            walletAddress: 'wallet-123',
            amount: '25.50',
            payWayCode: 'VISA_MASTER_CARD' as any,
            email: 'test@example.com',
          });
        })
      ).rejects.toThrow('Failed to create order');
    });

    it('sets error state on failure', async () => {
      const error = new Error('API Error');
      __mockWidget.createCashPaymentOrder.mockRejectedValue(error);

      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      try {
        await act(async () => {
          await result.current.createCashPaymentOrder({
            reference: 'ref-123',
            walletAddress: 'wallet-123',
            amount: '25.50',
            payWayCode: 'VISA_MASTER_CARD' as any,
            email: 'test@example.com',
          });
        });
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('input parameters', () => {
    it('passes all required parameters to API', async () => {
      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.createCashPaymentOrder({
          reference: 'unique-ref-789',
          walletAddress: '0x1234567890abcdef',
          amount: '500.00',
          payWayCode: 'GOOGLE_PAY' as any,
          email: 'payer@example.com',
        });
      });

      expect(__mockWidget.createCashPaymentOrder).toHaveBeenCalledWith({
        reference: 'unique-ref-789',
        walletAddress: '0x1234567890abcdef',
        amount: '500.00',
        payWayCode: 'GOOGLE_PAY',
        email: 'payer@example.com',
      });
    });

    it('handles different payment methods', async () => {
      const { result } = renderHook(
        () => useCreateCashPaymentOrder(defaultProps),
        { wrapper: createWrapper() }
      );

      const paymentMethods = ['VISA_MASTER_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'NETELLER', 'SKRILL'];

      for (const method of paymentMethods) {
        __mockWidget.createCashPaymentOrder.mockClear();

        await act(async () => {
          await result.current.createCashPaymentOrder({
            reference: 'ref-test',
            walletAddress: 'wallet-test',
            amount: '10.00',
            payWayCode: method as any,
            email: 'test@example.com',
          });
        });

        expect(__mockWidget.createCashPaymentOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            payWayCode: method,
          })
        );
      }
    });
  });
});
