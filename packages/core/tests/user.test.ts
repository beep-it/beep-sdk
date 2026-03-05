import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient } from '../src';

describe('User Module', () => {
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

  describe('getCurrentUser', () => {
    it('returns the current user with merchantId', async () => {
      const mockResponse = { merchantId: 'merch_abc123' };
      mockAxios.onGet('/v1/user').reply(200, mockResponse);

      const result = await client.user.getCurrentUser();

      expect(result.merchantId).toBe('merch_abc123');
    });

    it('returns null merchantId when not linked', async () => {
      const mockResponse = { merchantId: null };
      mockAxios.onGet('/v1/user').reply(200, mockResponse);

      const result = await client.user.getCurrentUser();

      expect(result.merchantId).toBeNull();
    });
  });
});
