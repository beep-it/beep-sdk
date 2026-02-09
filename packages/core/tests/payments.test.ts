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

  // STREAMING PAYMENT TESTS
  describe('Streaming Payments', () => {
    it('issuePayment creates a streaming payment request', async () => {
      const mockResponse = {
        referenceKey: 'ref_test123',
        invoiceId: 'inv_streaming456',
      };

      mockAxios.onPost('/v1/invoices/issue-payment').reply(200, mockResponse);

      const payload = {
        apiKey: 'test-api-key',
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
      expect(requestData.apiKey).toBe('test-api-key');
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
        apiKey: 'test-api-key',
        invoiceId: 'inv_streaming789',
      };

      const result = await client.payments.startStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/start');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.apiKey).toBe('test-api-key');
      expect(requestData.invoiceId).toBe('inv_streaming789');
    });

    it('pauseStreaming pauses a streaming session', async () => {
      const mockResponse = {
        success: true,
      };

      mockAxios.onPost('/v1/invoices/pause').reply(200, mockResponse);

      const payload = {
        apiKey: 'test-api-key',
        invoiceId: 'inv_streaming101',
      };

      const result = await client.payments.pauseStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/pause');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.apiKey).toBe('test-api-key');
      expect(requestData.invoiceId).toBe('inv_streaming101');
    });

    it('stopStreaming stops a streaming session and returns reference keys', async () => {
      const mockResponse = {
        invoiceId: 'inv_streaming202',
        referenceKeys: ['ref_123', 'ref_456', 'ref_789'],
      };

      mockAxios.onPost('/v1/invoices/stop').reply(200, mockResponse);

      const payload = {
        apiKey: 'test-api-key',
        invoiceId: 'inv_streaming202',
      };

      const result = await client.payments.stopStreaming(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/invoices/stop');

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.apiKey).toBe('test-api-key');
      expect(requestData.invoiceId).toBe('inv_streaming202');
    });

    it('handles errors in streaming payment methods', async () => {
      const errorMessage = 'Invoice not found';
      mockAxios.onPost('/v1/invoices/issue-payment').reply(404, { error: errorMessage });

      const payload = {
        apiKey: 'invalid-api-key',
        invoiceId: 'non-existent-invoice',
        assetChunks: [{ assetId: 'asset_1', quantity: 1 }],
        payingMerchantId: 'merchant_123',
      };

      await expect(client.payments.issuePayment(payload)).rejects.toThrow();
      expect(mockAxios.history.post.length).toBe(1);
    });
  });
});
