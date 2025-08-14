import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient } from '../src';
import { SupportedToken } from '../src/types';
import { TOKEN_ADDRESSES } from '../src/types/token';

describe('Products Module', () => {
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
      updatedAt: new Date().toISOString(),
    };

    mockAxios.onPost('/v1/products').reply(200, mockProduct);

    const result = await client.products.createProduct({
      name: 'Test Product',
      description: 'A test product',
      price: '9.99',
      token: SupportedToken.USDT,
      isSubscription: false,
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

    const result = await client.products.createProduct({
      name: 'Premium Subscription',
      description: 'Monthly subscription',
      price: '14.99',
      token: SupportedToken.USDT,
      isSubscription: true,
    });

    expect(result.isSubscription).toBe(true);

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.isSubscription).toBe(true);
  });

  it('getProduct returns a product by ID', async () => {
    const mockProduct = {
      id: 'prod_test123',
      name: 'Test Product',
      // other fields...
    };

    mockAxios.onGet('/v1/products/prod_test123').reply(200, mockProduct);

    const result = await client.products.getProduct('prod_test123');
    expect(result).toEqual(mockProduct);
  });

  it('listProducts returns all products', async () => {
    const mockProducts = [
      { id: 'prod_1', name: 'Product 1' },
      { id: 'prod_2', name: 'Product 2' },
    ];

    mockAxios.onGet('/v1/products').reply(200, mockProducts);

    const result = await client.products.listProducts();
    expect(result).toEqual(mockProducts);
  });

  it('updateProduct updates a product', async () => {
    const mockUpdatedProduct = {
      id: 'prod_test123',
      name: 'Updated Product',
      // other fields...
    };

    mockAxios.onPut('/v1/products/prod_test123').reply(200, mockUpdatedProduct);

    const result = await client.products.updateProduct('prod_test123', {
      name: 'Updated Product',
    });

    expect(result).toEqual(mockUpdatedProduct);
  });

  it('deleteProduct deletes a product', async () => {
    mockAxios.onDelete('/v1/products/prod_test123').reply(200, { deleted: true });

    await client.products.deleteProduct('prod_test123');

    expect(mockAxios.history.delete.length).toBe(1);
    expect(mockAxios.history.delete[0].url).toBe('/v1/products/prod_test123');
  });
});
