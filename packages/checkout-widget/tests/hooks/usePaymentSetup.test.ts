import { renderHook, waitFor } from '@testing-library/react';
import { usePaymentSetup } from '../../src/hooks/usePaymentSetup';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('usePaymentSetup', () => {
  const defaultProps = {
    assets: [{ assetId: 'asset_1', quantity: 1 }],
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.createPaymentSession.mockResolvedValue({
      referenceKey: 'test-ref-123',
      paymentUrl: 'sui:mock-payment-url',
      qrCode: 'data:image/png;base64,mockQrCode',
      amount: '25.50',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'pending',
      isCashPaymentEligible: true,
      destinationAddress: 'dest-address-123',
    });
  });

  describe('basic functionality', () => {
    it('creates payment session on mount', async () => {
      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalled();
      expect(result.current.data).toBeDefined();
    });

    it('returns payment setup data correctly', async () => {
      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        qrCode: 'data:image/png;base64,mockQrCode',
        referenceKey: 'test-ref-123',
        paymentUrl: 'sui:mock-payment-url',
        totalAmount: 25.5,
        isCashPaymentEligible: true,
        destinationAddress: 'dest-address-123',
      });
    });
  });

  describe('asset transformation', () => {
    it('transforms BeepPurchaseAsset correctly', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            assets: [{ assetId: 'product-123', quantity: 2 }],
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: [{ assetId: 'product-123', quantity: 2 }],
        }),
      );
    });

    it('transforms CreateProductPayload to EphemeralItem', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            assets: [{ name: 'Test Product', price: '19.99', description: 'A test product' }],
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: [
            expect.objectContaining({
              name: 'Test Product',
              price: '19.99',
              quantity: 1,
              description: 'A test product',
            }),
          ],
        }),
      );
    });

    it('transforms numeric price to string', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            assets: [{ name: 'Numeric Price Product', price: 29.99 }] as any,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: [
            expect.objectContaining({
              name: 'Numeric Price Product',
              price: '29.99',
            }),
          ],
        }),
      );
    });

    it('handles mixed asset types', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            assets: [
              { name: 'New Product', price: '15.00', description: 'Ephemeral item' },
              { assetId: 'existing-product', quantity: 3 },
            ],
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: [
            expect.objectContaining({
              name: 'New Product',
              price: '15.00',
              quantity: 1,
            }),
            { assetId: 'existing-product', quantity: 3 },
          ],
        }),
      );
    });

    it('uses quantity from CreateProductPayload if provided', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            assets: [{ name: 'Multi-quantity Product', price: '10.00', quantity: 5 }] as any,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          assets: [
            expect.objectContaining({
              name: 'Multi-quantity Product',
              quantity: 5,
            }),
          ],
        }),
      );
    });
  });

  describe('price formatting', () => {
    it('parses string amount from response', async () => {
      __mockWidget.createPaymentSession.mockResolvedValue({
        referenceKey: 'ref-123',
        paymentUrl: 'sui:url',
        amount: '123.45',
        isCashPaymentEligible: false,
        destinationAddress: 'dest',
      });

      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.totalAmount).toBe(123.45);
    });

    it('handles missing amount in response', async () => {
      __mockWidget.createPaymentSession.mockResolvedValue({
        referenceKey: 'ref-123',
        paymentUrl: 'sui:url',
        isCashPaymentEligible: false,
        destinationAddress: 'dest',
      });

      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.totalAmount).toBe(0);
    });
  });

  describe('response mapping', () => {
    it('maps all response fields correctly', async () => {
      __mockWidget.createPaymentSession.mockResolvedValue({
        referenceKey: 'unique-ref',
        paymentUrl: 'sui:payment-url',
        qrCode: 'base64-qr-code',
        amount: '99.99',
        expiresAt: '2025-01-01T00:00:00Z',
        status: 'pending',
        isCashPaymentEligible: true,
        destinationAddress: 'destination-wallet',
      });

      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toMatchObject({
        qrCode: 'base64-qr-code',
        referenceKey: 'unique-ref',
        paymentUrl: 'sui:payment-url',
        totalAmount: 99.99,
        isCashPaymentEligible: true,
        destinationAddress: 'destination-wallet',
      });
      // processedAssets contains the BeepPurchaseAsset types from input
      expect(result.current.data?.processedAssets).toBeDefined();
    });

    it('handles null qrCode', async () => {
      __mockWidget.createPaymentSession.mockResolvedValue({
        referenceKey: 'ref',
        paymentUrl: 'url',
        qrCode: null,
        amount: '10.00',
        isCashPaymentEligible: false,
        destinationAddress: 'dest',
      });

      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.qrCode).toBeNull();
    });
  });

  describe('payment label', () => {
    it('passes payment label to API', async () => {
      const { result } = renderHook(
        () =>
          usePaymentSetup({
            ...defaultProps,
            paymentLabel: 'My Store Checkout',
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.createPaymentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentLabel: 'My Store Checkout',
          generateQrCode: true,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      __mockWidget.createPaymentSession.mockRejectedValue(new Error('Payment session failed'));

      const { result } = renderHook(() => usePaymentSetup(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('query caching', () => {
    it('caches results for same assets', async () => {
      const wrapper = createWrapper();
      const assets = [{ assetId: 'asset-1', quantity: 1 }];

      const { result: result1 } = renderHook(() => usePaymentSetup({ ...defaultProps, assets }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const callCountAfterFirst = __mockWidget.createPaymentSession.mock.calls.length;

      // Same assets should use cache
      const { result: result2 } = renderHook(() => usePaymentSetup({ ...defaultProps, assets }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should not have made another API call
      expect(__mockWidget.createPaymentSession.mock.calls.length).toBe(callCountAfterFirst);
    });

    it('fetches new data for different assets', async () => {
      const wrapper = createWrapper();

      const { result: result1 } = renderHook(
        () => usePaymentSetup({ ...defaultProps, assets: [{ assetId: 'asset-1', quantity: 1 }] }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(
        () => usePaymentSetup({ ...defaultProps, assets: [{ assetId: 'asset-2', quantity: 1 }] }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should have made 2 API calls for different assets
      expect(__mockWidget.createPaymentSession).toHaveBeenCalledTimes(2);
    });
  });
});
