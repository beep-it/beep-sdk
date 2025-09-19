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

  describe('signSolanaTransaction', () => {
    const validInput = {
      senderAddress: '11111111111111111111111111111111',
      recipientAddress: '22222222222222222222222222222222',
      tokenMintAddress: '33333333333333333333333333333333',
      amount: 100000,
      decimals: 6,
    };

    it('returns null when required fields are missing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Test missing senderAddress
      const result1 = await client.payments.signSolanaTransaction({
        ...validInput,
        senderAddress: '',
      });

      expect(result1).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Missing required fields');

      // Test missing recipientAddress
      const result2 = await client.payments.signSolanaTransaction({
        ...validInput,
        recipientAddress: '',
      });

      expect(result2).toBeNull();

      // Test missing tokenMintAddress
      const result3 = await client.payments.signSolanaTransaction({
        ...validInput,
        tokenMintAddress: '',
      });

      expect(result3).toBeNull();

      // Test missing amount
      const result4 = await client.payments.signSolanaTransaction({
        ...validInput,
        amount: 0,
      });

      expect(result4).toBeNull();

      // Test missing decimals
      const result5 = await client.payments.signSolanaTransaction({
        ...validInput,
        decimals: 0,
      });

      expect(result5).toBeNull();

      expect(mockAxios.history.post.length).toBe(0); // No API calls should be made

      consoleErrorSpy.mockRestore();
    });

    it('successfully signs transaction with valid input', async () => {
      const mockTransactionData = {
        signedTransaction: 'base64-encoded-signed-transaction',
        transactionId: 'txn_12345',
        signature: 'signature-string',
      };

      const mockResponse = {
        data: mockTransactionData,
      };

      mockAxios.onPost('/v1/payment/sign-solana-transaction').reply(200, mockResponse);

      const result = await client.payments.signSolanaTransaction(validInput);

      expect(result).toEqual(mockTransactionData);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/payment/sign-solana-transaction');

      // Verify the request payload
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData).toEqual(validInput);
    });

    it('throws error when API returns no data', async () => {
      mockAxios.onPost('/v1/payment/sign-solana-transaction').reply(200, {});

      await expect(client.payments.signSolanaTransaction(validInput)).rejects.toThrow(
        'Failed to sign solana transaction: No data returned from solana transaction signing',
      );
    });

    it('throws error when API call fails', async () => {
      mockAxios.onPost('/v1/payment/sign-solana-transaction').reply(500, {
        error: 'Internal server error',
      });

      await expect(client.payments.signSolanaTransaction(validInput)).rejects.toThrow(
        'Failed to sign solana transaction:',
      );

      expect(mockAxios.history.post.length).toBe(1);
    });

    it('throws error when network error occurs', async () => {
      mockAxios.onPost('/v1/payment/sign-solana-transaction').networkError();

      await expect(client.payments.signSolanaTransaction(validInput)).rejects.toThrow(
        'Failed to sign solana transaction:',
      );

      expect(mockAxios.history.post.length).toBe(1);
    });

    it('handles different amount values correctly', async () => {
      const mockResponse = {
        data: {
          signedTransaction: 'base64-encoded-signed-transaction',
          transactionId: 'txn_12345',
        },
      };

      mockAxios.onPost('/v1/payment/sign-solana-transaction').reply(200, mockResponse);

      // Test with large amount
      const largeAmountInput = {
        ...validInput,
        amount: 1000000000, // 1 billion units
      };

      const result = await client.payments.signSolanaTransaction(largeAmountInput);

      expect(result).toEqual(mockResponse.data);

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.amount).toBe(1000000000);
    });

    it('handles different decimal values correctly', async () => {
      const mockResponse = {
        data: {
          signedTransaction: 'base64-encoded-signed-transaction',
          transactionId: 'txn_12345',
        },
      };

      mockAxios.onPost('/v1/payment/sign-solana-transaction').reply(200, mockResponse);

      // Test with 9 decimals (SOL)
      const solInput = {
        ...validInput,
        decimals: 9,
      };

      const result = await client.payments.signSolanaTransaction(solInput);

      expect(result).toEqual(mockResponse.data);

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.decimals).toBe(9);
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
