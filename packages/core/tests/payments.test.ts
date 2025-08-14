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
    it('returns null when no paymentReference and no assetIds provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await client.payments.requestAndPurchaseAsset({});

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'One of paymentReference or assetIds is required',
      );
      expect(mockAxios.history.post.length).toBe(0); // No API call should be made

      consoleErrorSpy.mockRestore();
    });

    it('calls endpoint and returns mocked data when paymentReference provided but no assetIds', async () => {
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
      });

      expect(result).toEqual(mockProduct);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/payment/request-payment');
    });

    it('calls endpoint and returns mocked data when assetIds provided but no paymentReference', async () => {
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
        assetIds: ['asset_1', 'asset_2'],
      });

      expect(result).toEqual(mockProduct);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/v1/payment/request-payment');
    });
  });
});
