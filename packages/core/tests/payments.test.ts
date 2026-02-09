import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient } from '../src';

describe('Payments Module', () => {
  let client: BeepClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    client = new BeepClient({
      apiKey: 'test-api-key',
      serverUrl: 'https://test-api.beep.com',
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('requestAndPurchaseAsset', () => {
    it('returns null when no paymentReference and no assets provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.payments.requestAndPurchaseAsset({ assets: [] });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('One of paymentReference or assets is required');
      expect(mockAxios.history.post.length).toBe(0); // No API call should be made

      consoleErrorSpy.mockRestore();
    });

    it('calls endpoint and returns mocked data when paymentReference provided but no assets', async () => {
      const mockProduct = {
        id: 'prod_test123',
        name: 'Test Product',
        description: 'A test product',
        price: '9.99',
      };

      const mockResponse = {
        success: true,
        data: mockProduct,
      };

      mockAxios.onPost('/v1/payment/request-payment').reply(200, mockResponse);

      const result = await client.payments.requestAndPurchaseAsset({
        paymentReference: 'pay_ref_123',
        assets: [
          { assetId: 'asset_1', quantity: 1 },
          { assetId: 'asset_2', quantity: 1 },
        ],
      });

      expect(result).toEqual(mockProduct);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/payment/request-payment');
    });

    it('calls endpoint and returns mocked data when assets provided but no paymentReference', async () => {
      const mockProduct = {
        id: 'prod_test456',
        name: 'Asset Product',
        description: 'Product from asset',
        price: '15.99',
      };

      const mockResponse = {
        success: true,
        data: mockProduct,
      };

      mockAxios.onPost('/v1/payment/request-payment').reply(200, mockResponse);

      const result = await client.payments.requestAndPurchaseAsset({
        assets: [
          { assetId: 'asset_1', quantity: 1 },
          { assetId: 'asset_2', quantity: 1 },
        ],
      });

      expect(result).toEqual(mockProduct);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/payment/request-payment');
    });
  });

  describe('requestAndPurchaseAsset - 402 handling', () => {
    it('normalizes 402 Payment Required by returning the data payload', async () => {
      const paymentData = {
        referenceKey: 'ref_402_test',
        paymentUrl: 'sui:pay?recipient=0xabc',
        amount: 50,
        status: 'PENDING',
      };

      mockAxios.onPost('/v1/payment/request-payment').reply(402, { data: paymentData });

      const result = await client.payments.requestAndPurchaseAsset({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
      });

      expect(result).toEqual(paymentData);
    });

    it('returns null and logs on non-402 error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockAxios.onPost('/v1/payment/request-payment').reply(500, { error: 'Server error' });

      const result = await client.payments.requestAndPurchaseAsset({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
      });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to request and purchase asset:',
        expect.anything(),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createPayout', () => {
    it('creates a payout successfully', async () => {
      const mockResponse = {
        payoutId: 'payout_123',
        status: 'accepted',
        message: 'Payout accepted',
        withdrawRequestId: 42,
        requestedAmount: '1000000',
        reservedAmount: '1000000',
        createdAt: '2025-01-01T00:00:00Z',
      };

      mockAxios.onPost('/v1/payouts').reply(200, mockResponse);

      const result = await client.payments.createPayout({
        amount: '1000000',
        destinationWalletAddress: '0xdest',
        chain: 'SUI',
        token: 'USDC',
      });

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('accepted');
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.amount).toBe('1000000');
      expect(requestData.chain).toBe('SUI');
    });

    it('throws on failure', async () => {
      mockAxios.onPost('/v1/payouts').reply(400, { error: 'Insufficient funds' });

      await expect(
        client.payments.createPayout({
          amount: '999999999',
          destinationWalletAddress: '0xdest',
          chain: 'SUI',
          token: 'USDC',
        }),
      ).rejects.toThrow();
    });
  });

  describe('checkPaymentStatus', () => {
    it('returns payment status for a reference key', async () => {
      const mockResponse = {
        status: 'COMPLETED',
        amount: '1000000',
        chain: 'SUI',
        token: 'USDC',
        destinationWalletAddress: '0xdest',
      };

      mockAxios.onPost('/v1/invoices/check-payment-status').reply(200, mockResponse);

      const result = await client.payments.checkPaymentStatus({ referenceKey: 'ref_123' });

      expect(result.status).toBe('COMPLETED');
      expect(result.amount).toBe('1000000');
    });

    it('returns NOT_FOUND for unknown reference', async () => {
      mockAxios.onPost('/v1/invoices/check-payment-status').reply(200, { status: 'NOT_FOUND' });

      const result = await client.payments.checkPaymentStatus({ referenceKey: 'ref_unknown' });

      expect(result.status).toBe('NOT_FOUND');
    });
  });

  describe('waitForPaymentCompletion', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns paid:true when referenceKey disappears from response', async () => {
      // First call: still pending (402 with referenceKey)
      mockAxios
        .onPost('/v1/payment/request-payment')
        .replyOnce(402, { data: { referenceKey: 'ref_123', status: 'PENDING' } })
        // Second call: paid (200 with no referenceKey)
        .onPost('/v1/payment/request-payment')
        .replyOnce(200, { data: { status: 'COMPLETED' } });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
      });

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result.paid).toBe(true);
    });

    it('returns paid:false on timeout', async () => {
      mockAxios.onPost('/v1/payment/request-payment').reply(402, {
        data: { referenceKey: 'ref_123', status: 'PENDING' },
      });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 250,
      });

      await jest.advanceTimersByTimeAsync(300);

      const result = await promise;
      expect(result.paid).toBe(false);
    });

    it('returns paid:false when signal is aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        signal: controller.signal,
      });

      expect(result.paid).toBe(false);
    });

    it('returns paid:false on expired status', async () => {
      mockAxios.onPost('/v1/payment/request-payment').reply(200, {
        data: { referenceKey: 'ref_123', status: 'expired' },
      });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
      });

      await jest.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result.paid).toBe(false);
      expect(result.last?.status).toBe('expired');
    });

    it('returns paid:false on failed status', async () => {
      mockAxios.onPost('/v1/payment/request-payment').reply(200, {
        data: { referenceKey: 'ref_123', status: 'failed' },
      });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
      });

      await jest.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result.paid).toBe(false);
    });

    it('aborts early on fatal HTTP status (400)', async () => {
      const onError = jest.fn();
      mockAxios.onPost('/v1/payment/request-payment').reply(400, { error: 'Bad request' });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
        onError,
      });

      await jest.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result.paid).toBe(false);
      expect(onError).toHaveBeenCalled();
    });

    it('applies exponential backoff on transient errors (500)', async () => {
      const onError = jest.fn();
      mockAxios
        .onPost('/v1/payment/request-payment')
        .replyOnce(500, { error: 'Server error' })
        .onPost('/v1/payment/request-payment')
        .replyOnce(200, { data: { status: 'COMPLETED' } });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 10000,
        onError,
      });

      // First: error → backoff ceil(100 * 1.5) = 150ms
      await jest.advanceTimersByTimeAsync(150);
      // Second: success
      await jest.advanceTimersByTimeAsync(150);

      const result = await promise;
      expect(result.paid).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('calls onUpdate on each poll cycle', async () => {
      const onUpdate = jest.fn();
      mockAxios
        .onPost('/v1/payment/request-payment')
        .replyOnce(402, { data: { referenceKey: 'ref_123', status: 'PENDING' } })
        .onPost('/v1/payment/request-payment')
        .replyOnce(200, { data: { status: 'COMPLETED' } });

      const promise = client.payments.waitForPaymentCompletion({
        assets: [{ assetId: 'asset_1', quantity: 1 }],
        paymentReference: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
        onUpdate,
      });

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);

      await promise;
      expect(onUpdate).toHaveBeenCalledTimes(2);
    });
  });

  // STREAMING PAYMENT TESTS
  describe('Streaming Payments', () => {
    it('issuePayment creates a streaming payment request', async () => {
      const mockResponse = {
        referenceKey: 'ref_test123',
        invoiceId: 'inv_streaming456',
      };

      mockAxios.onPost('/v1/invoices/issue-payment').reply(200, mockResponse);

      const payload = {
        invoiceId: 'inv_streaming456',
        assetChunks: [
          { assetId: 'asset_1', quantity: 2 },
          { assetId: 'asset_2', quantity: 1 },
        ],
        payingMerchantId: 'merchant_123',
      };

      const result = await client.payments.issuePayment(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/issue-payment');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.invoiceId).toBe('inv_streaming456');
      expect(requestData.assetChunks).toHaveLength(2);
      expect(requestData.payingMerchantId).toBe('merchant_123');
    });

    it('startStreaming starts a streaming session', async () => {
      const mockResponse = {
        invoiceId: 'inv_streaming789',
      };

      mockAxios.onPost('/v1/invoices/start').reply(200, mockResponse);

      const payload = {
        invoiceId: 'inv_streaming789',
      };

      const result = await client.payments.startStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/start');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.invoiceId).toBe('inv_streaming789');
    });

    it('pauseStreaming pauses a streaming session', async () => {
      const mockResponse = {
        success: true,
      };

      mockAxios.onPost('/v1/invoices/pause').reply(200, mockResponse);

      const payload = {
        invoiceId: 'inv_streaming101',
      };

      const result = await client.payments.pauseStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/pause');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.invoiceId).toBe('inv_streaming101');
    });

    it('stopStreaming stops a streaming session and returns reference keys', async () => {
      const mockResponse = {
        invoiceId: 'inv_streaming202',
        referenceKeys: ['ref_123', 'ref_456', 'ref_789'],
      };

      mockAxios.onPost('/v1/invoices/stop').reply(200, mockResponse);

      const payload = {
        invoiceId: 'inv_streaming202',
      };

      const result = await client.payments.stopStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/stop');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.invoiceId).toBe('inv_streaming202');
    });

    it('handles errors in streaming payment methods', async () => {
      const errorMessage = 'Invoice not found';
      mockAxios.onPost('/v1/invoices/issue-payment').reply(404, { error: errorMessage });

      const payload = {
        invoiceId: 'non-existent-invoice',
        assetChunks: [{ assetId: 'asset_1', quantity: 1 }],
        payingMerchantId: 'merchant_123',
      };

      await expect(client.payments.issuePayment(payload)).rejects.toThrow();
      expect(mockAxios.history.post.length).toBe(1);
    });
  });
});
