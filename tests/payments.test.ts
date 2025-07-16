import { BeepClient, SupportedToken, TOKEN_ADDRESSES } from '../src';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('Payments Module', () => {
  let client: BeepClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    client = new BeepClient({
      apiKey: 'test-api-key',
      serverUrl: 'https://test-api.beep.com'
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  // PRODUCT TESTS
  describe('Products', () => {
    it('createProduct creates a product with token', async () => {
      const mockProduct = {
        id: 'prod_test123',
        merchantId: 'merch_123',
        name: 'Test Product',
        description: 'A test product',
        price: '9.99',
        token: SupportedToken.USDT,
        splTokenAddress: TOKEN_ADDRESSES[SupportedToken.USDT],
        isSubscription: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockAxios.onPost('/v1/products').reply(200, mockProduct);

      const result = await client.payments.createProduct({
        name: 'Test Product',
        description: 'A test product',
        price: '9.99',
        token: SupportedToken.USDT,
        isSubscription: false
      });

      expect(result).toEqual(mockProduct);
      
      // Verify the request
      expect(mockAxios.history.post.length).toBe(1);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.token).toBe(SupportedToken.USDT);
    });

    it('createProduct creates a subscription product', async () => {
      mockAxios.onPost('/v1/products').reply(200, {
        id: 'prod_sub123',
        name: 'Premium Subscription',
        isSubscription: true,
        // other fields...
      });

      const result = await client.payments.createProduct({
        name: 'Premium Subscription',
        description: 'Monthly subscription',
        price: '14.99',
        token: SupportedToken.USDT,
        isSubscription: true
      });

      expect(result.isSubscription).toBe(true);
      
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.isSubscription).toBe(true);
    });

    // Note: We've removed the metered product test as the current SDK doesn't support metadata
    // If you need metered billing, you would need to extend the Product type to include metadata

    it('getProduct returns a product by ID', async () => {
      const mockProduct = {
        id: 'prod_test123',
        name: 'Test Product',
        // other fields...
      };
      
      mockAxios.onGet('/v1/products/prod_test123').reply(200, mockProduct);

      const result = await client.payments.getProduct('prod_test123');
      expect(result).toEqual(mockProduct);
    });

    it('listProducts returns all products', async () => {
      const mockProducts = [
        { id: 'prod_1', name: 'Product 1' },
        { id: 'prod_2', name: 'Product 2' }
      ];
      
      mockAxios.onGet('/v1/products').reply(200, mockProducts);

      const result = await client.payments.listProducts();
      expect(result).toEqual(mockProducts);
    });

    it('updateProduct updates a product', async () => {
      const mockUpdatedProduct = {
        id: 'prod_test123',
        name: 'Updated Product',
        // other fields...
      };
      
      mockAxios.onPut('/v1/products/prod_test123').reply(200, mockUpdatedProduct);

      const result = await client.payments.updateProduct('prod_test123', {
        name: 'Updated Product'
      });
      
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('deleteProduct deletes a product', async () => {
      mockAxios.onDelete('/v1/products/prod_test123').reply(200, { deleted: true });

      await client.payments.deleteProduct('prod_test123');
      
      expect(mockAxios.history.delete.length).toBe(1);
      expect(mockAxios.history.delete[0].url).toBe('/v1/products/prod_test123');
    });
  });

  // INVOICE TESTS
  describe('Invoices', () => {
    it('createInvoice creates a product-based invoice', async () => {
      const mockInvoice = {
        id: 'inv_test123',
        productId: 'prod_test123',
        status: 'pending',
        payerType: 'customer_wallet',
        // other fields...
      };
      
      mockAxios.onPost('/v1/invoices').reply(200, mockInvoice);

      const result = await client.payments.createInvoice({
        productId: 'prod_test123',
        payerType: 'customer_wallet'
      });
      
      expect(result).toEqual(mockInvoice);
      
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.productId).toBe('prod_test123');
      expect(requestData.payerType).toBe('customer_wallet');
    });

    it('createInvoice creates a custom invoice with token', async () => {
      const mockInvoice = {
        id: 'inv_custom123',
        amount: '25.99',
        token: SupportedToken.USDT,
        payerType: 'customer_wallet',
        // other fields...
      };
      
      mockAxios.onPost('/v1/invoices').reply(200, mockInvoice);

      const result = await client.payments.createInvoice({
        amount: '25.99',
        token: SupportedToken.USDT,
        description: 'Custom invoice',
        payerType: 'customer_wallet'
      });
      
      expect(result).toEqual(mockInvoice);
      
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.token).toBe(SupportedToken.USDT);
      expect(requestData.payerType).toBe('customer_wallet');
    });

    it('getInvoice returns an invoice by ID', async () => {
      const mockInvoice = {
        id: 'inv_test123',
        status: 'pending',
        // other fields...
      };
      
      mockAxios.onGet('/v1/invoices/inv_test123').reply(200, mockInvoice);

      const result = await client.payments.getInvoice('inv_test123');
      expect(result).toEqual(mockInvoice);
    });

    it('listInvoices returns all invoices', async () => {
      const mockInvoices = [
        { id: 'inv_1', status: 'paid' },
        { id: 'inv_2', status: 'pending' }
      ];
      
      mockAxios.onGet('/v1/invoices').reply(200, mockInvoices);

      const result = await client.payments.listInvoices();
      expect(result).toEqual(mockInvoices);
    });

    it('deleteInvoice deletes an invoice', async () => {
      mockAxios.onDelete('/v1/invoices/inv_test123').reply(200, { deleted: true });

      await client.payments.deleteInvoice('inv_test123');
      
      expect(mockAxios.history.delete.length).toBe(1);
      expect(mockAxios.history.delete[0].url).toBe('/v1/invoices/inv_test123');
    });
  });
});
