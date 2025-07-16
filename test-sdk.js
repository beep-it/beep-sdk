/**
 * Basic test script for the Beep SDK
 */
const { BeepClient, SupportedToken } = require('./dist');

// Replace with your API key
const API_KEY = 'test-api-key';

// Create a client instance
// For local testing, override the API server URL
const client = new BeepClient({
  apiKey: API_KEY,
  serverUrl: 'http://localhost:3000'  // Update this to point to your API server
});

async function runTests() {
  try {
    console.log('Testing SDK compatibility with latest API...');
    
    // Test 1: Health check
    console.log('\n1. Testing health check...');
    try {
      const health = await client.healthCheck();
      console.log('Health check success:', health);
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
    
    // Test 2: Request Payment with token enum
    console.log('\n2. Testing request payment with token enum...');
    try {
      const paymentRequest = await client.requestPayment({
        amount: 10.99,
        token: SupportedToken.USDC,
        description: 'Test payment with token enum'
      });
      console.log('Payment request success:', paymentRequest);
    } catch (error) {
      console.error('Payment request failed:', error.message);
    }
    
    // Test 3: Create Product with token enum
    console.log('\n3. Testing create product with token enum...');
    try {
      const product = await client.payments.createProduct({
        name: 'Test Product',
        price: '9.99',
        token: SupportedToken.USDC,
        description: 'A test product using token enum',
        isSubscription: false
      });
      console.log('Product created successfully:', product);
      
      // Test 3b: Get the product we just created
      console.log('\n3b. Testing get product...');
      const retrievedProduct = await client.payments.getProduct(product.id);
      console.log('Product retrieved successfully:', retrievedProduct);
    } catch (error) {
      console.error('Product tests failed:', error.message);
    }
    
    // Test 4: Create Invoice with token enum
    console.log('\n4. Testing create invoice with token enum...');
    try {
      const invoice = await client.payments.createInvoice({
        description: 'Test Invoice',
        amount: '19.99',
        token: SupportedToken.USDC,
        payerType: 'customer_wallet'
      });
      console.log('Invoice created successfully:', invoice);
      
      // Test 4b: Get the invoice we just created
      console.log('\n4b. Testing get invoice...');
      const retrievedInvoice = await client.payments.getInvoice(invoice.id);
      console.log('Invoice retrieved successfully:', retrievedInvoice);
    } catch (error) {
      console.error('Invoice tests failed:', error.message);
    }
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
}

// Run the tests
runTests();
