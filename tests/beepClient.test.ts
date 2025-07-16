import { BeepClient, SupportedToken } from '../src';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('BeepClient', () => {
  let client: BeepClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockAxios = new MockAdapter(axios);
    
    // Initialize the client with test values
    client = new BeepClient({
      apiKey: 'test-api-key',
      serverUrl: 'https://test-api.beep.com'
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  test('healthCheck should check API health', async () => {
    // Mock a successful health check response
    mockAxios.onGet('/healthz').reply(200, 'API is healthy');

    const result = await client.healthCheck();
    
    expect(result).toBeDefined();
    expect(result).toBe('API is healthy');
  });

  test('requestPayment creates an invoice with token', async () => {
    // Mock the response for the API call
    mockAxios.onPost('/v1/payments/request-payment').reply(200, {
      id: 'inv_test123',
      merchantId: 'merch_123',
      payerType: 'customer_wallet',
      payerMerchantId: null,
      description: 'Test payment',
      amount: '10.99',
      token: SupportedToken.USDC,
      splTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      status: 'pending',
      referenceKey: 'ref_abc123',
      paymentUrl: 'https://pay.beep.com/abc123',
      qrCode: 'data:image/png;base64,abc123==',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Call the method being tested
    const result = await client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: 'Test payment'
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.id).toBe('inv_test123');
    expect(result.amount).toBe('10.99');
    expect(result.status).toBe('pending');
    
    // Verify the request was made with correct data
    expect(mockAxios.history.post.length).toBe(1);
    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.token).toBe(SupportedToken.USDC);
    expect(requestData.amount).toBe(10.99);
  });

  test('requestPayment falls back to splTokenAddress if token not provided', async () => {
    const splTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    mockAxios.onPost('/v1/payments/request-payment').reply(200, {
      id: 'inv_test123',
      merchantId: 'merch_123',
      payerType: 'customer_wallet',
      payerMerchantId: null,
      description: 'Test payment',
      amount: '10.99',
      splTokenAddress: splTokenAddress,
      status: 'pending',
      referenceKey: 'ref_abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const result = await client.requestPayment({
      amount: 10.99,
      splTokenAddress: splTokenAddress,
      description: 'Test payment'
    });

    expect(result).toBeDefined();
    expect(result.splTokenAddress).toBe(splTokenAddress);
    
    // Verify the request was made with correct data
    expect(mockAxios.history.post.length).toBe(1);
    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.splTokenAddress).toBe(splTokenAddress);
  });

  test('requestPayment defaults to USDC if no token or splTokenAddress provided', async () => {
    mockAxios.onPost('/v1/payments/request-payment').reply(200, {
      id: 'inv_test123',
      merchantId: 'merch_123',
      status: 'pending',
      // other fields...
    });

    await client.requestPayment({
      amount: 10.99,
      description: 'Test payment'
    });

    // Verify the request was made with USDC token
    expect(mockAxios.history.post.length).toBe(1);
    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.token).toBe(SupportedToken.USDC);
  });

  test('requestPayment throws error when API request fails', async () => {
    mockAxios.onPost('/v1/payments/request-payment').reply(400, {
      error: 'Invalid request'
    });

    await expect(client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: 'Test payment'
    })).rejects.toThrow();
  });
});
