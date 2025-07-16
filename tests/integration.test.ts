import { BeepClient, SupportedToken } from '../src';

// These tests are skipped by default as they require a running API and API key
// To run these tests, you need to:
// 1. Have a running beep API server
// 2. Set the BEEP_API_KEY and BEEP_API_URL environment variables
// 3. Remove the .skip from the describe block

describe.skip('Integration Tests', () => {
  let client: BeepClient;

  beforeAll(() => {
    // Initialize client with environment variables
    client = new BeepClient({
      apiKey: process.env.BEEP_API_KEY || 'test-api-key',
      serverUrl: process.env.BEEP_API_URL || 'http://localhost:3000'
    });
  });

  test('healthCheck should return health status', async () => {
    const health = await client.healthCheck();
    expect(health).toBeDefined();
    // We only check if it returns something as the actual response format may vary
  });

  test('requestPayment creates a valid invoice', async () => {
    const invoice = await client.requestPayment({
      amount: 0.01, // Small amount for testing
      token: SupportedToken.USDC,
      description: 'Integration test payment',
      payerType: 'customer_wallet'
    });

    expect(invoice).toBeDefined();
    expect(invoice.id).toBeDefined();
    // The invoice may not have a paymentUrl property in the response
    // so we just check it has the required fields
  });

  test('payments module can create and retrieve a product', async () => {
    // Create a test product
    const product = await client.payments.createProduct({
      name: `Test Product ${Date.now()}`, // Unique name
      description: 'Created by integration test',
      price: '0.01',
      token: SupportedToken.USDC,
      isSubscription: false
    });

    expect(product).toBeDefined();
    expect(product.id).toBeDefined();

    // Retrieve the product
    const retrievedProduct = await client.payments.getProduct(product.id);
    expect(retrievedProduct).toBeDefined();
    expect(retrievedProduct.id).toBe(product.id);
    
    // Clean up
    await client.payments.deleteProduct(product.id);
  });
  
  test('payments module should create and get an invoice', async () => {
    // Create a test product
    const product = await client.payments.createProduct({
      name: 'Integration Test Product',
      price: '0.01',
      token: SupportedToken.USDC,
      description: 'Test product for integration tests'
    });

    // Create an invoice from the product
    const invoice = await client.payments.createInvoice({
      productId: product.id,
      payerType: 'customer_wallet'
    });

    expect(invoice).toBeDefined();
    expect(invoice.id).toBeDefined();
    // The invoice may not have a paymentUrl property in the response
    // so we just check it has the required fields
    
    // Get the invoice and check it matches
    const retrievedInvoice = await client.payments.getInvoice(invoice.id);
    expect(retrievedInvoice.id).toBe(invoice.id);
    
    // Clean up
    await client.payments.deleteInvoice(invoice.id);
  }, 10000);
});
