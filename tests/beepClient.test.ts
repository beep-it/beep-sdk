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

  it('healthCheck should check API health', async () => {
    // Mock a successful health check response
    mockAxios.onGet('/healthz').reply(200, 'API is healthy');

    const result = await client.healthCheck();
    
    expect(result).toBeDefined();
    expect(result).toBe('API is healthy');
  });

  it('requestPayment creates an invoice with token', async () => {
    // Mock the response for the API call
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      paymentUrl: 'https://pay.beep.com/abc123',
      qrCode: 'data:image/png;base64,abc123==',
      amount: '10.99',
      token: SupportedToken.USDC,
      splTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      status: 'pending',
      expiresAt: new Date().toISOString(),
      receivingMerchantId: 'merch_123',
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
    expect(result.invoiceId).toBe('inv_test123');
    expect(result.amount).toBe('10.99');
    expect(result.status).toBe('pending');
    
    // Verify the request was made with correct data
    expect(mockAxios.history.post.length).toBe(1);
    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.token).toBe(SupportedToken.USDC);
    expect(requestData.amount).toBe(10990000);
  });

  it('requestPayment falls back to splTokenAddress if token not provided', async () => {
    const splTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
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

  it('requestPayment defaults to USDC if no token or splTokenAddress provided', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      merchantId: 'merch_123',
      status: 'pending',
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

  it('requestPayment throws error when API request fails', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(500);

    await expect(client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: 'Test payment'
    })).rejects.toThrow();
  });

  it('requestPayment throws error when response has no data', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, null);

    await expect(client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: 'Test payment'
    })).rejects.toThrow('No data returned from payment request');
  });

  it('converts amount to base units correctly for different tokens', async () => {
    // Setup mock for USDC test
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
      expiresAt: new Date().toISOString(),
      receivingMerchantId: 'merch_123'
    });

    // Test USDC (6 decimals)
    await client.requestPayment({
      amount: 0.01,
      token: SupportedToken.USDC,
      description: 'USDC payment'
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    // 0.01 with 6 decimals should be 10000
    expect(requestData.amount).toBe(10000);
  });
  
  it('converts amount to base units correctly for USDT', async () => {
    // Setup mock for USDT test
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
      expiresAt: new Date().toISOString(),
      receivingMerchantId: 'merch_123'
    });
    
    // Test USDT (6 decimals)
    await client.requestPayment({
      amount: 0.000001,
      token: SupportedToken.USDT,
      description: 'USDT minimum payment'
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    // 0.000001 with 6 decimals should be 1
    expect(requestData.amount).toBe(1);
  });

  it('handles payerType correctly when provided', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
    });

    await client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: 'Test payment',
      payerType: 'merchant_wallet'
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.payerType).toBe('merchant_wallet');
  });
  
  it('handles empty description by setting a default', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
    });

    await client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC,
      description: ''
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.description).toBe('Payment request');
  });
  
  it('handles undefined description by setting a default', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
    });

    await client.requestPayment({
      amount: 10.99,
      token: SupportedToken.USDC
      // description omitted
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.description).toBe('Payment request');
  });
  
  it('handles large amounts correctly', async () => {
    mockAxios.onPost('/v1/payment/request-payment').reply(200, {
      invoiceId: 'inv_test123',
      referenceKey: 'ref_abc123',
      status: 'pending',
    });
    
    // Test with a large amount (1000 USDC)
    await client.requestPayment({
      amount: 1000,
      token: SupportedToken.USDC,
      description: 'Large payment'
    });

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    // 1000 with 6 decimals should be 1000000000
    expect(requestData.amount).toBe(1000000000);
  });
});
