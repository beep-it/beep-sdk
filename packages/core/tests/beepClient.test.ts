import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient, BeepPublicClient } from '../src';

describe('BeepClient', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('constructor', () => {
    it('throws when API key is missing', () => {
      expect(() => new BeepClient({ apiKey: '' })).toThrow('API key is required');
    });

    it('uses default server URL when not provided', () => {
      const client = new BeepClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('uses custom server URL when provided', () => {
      const client = new BeepClient({ apiKey: 'test-key', serverUrl: 'https://custom.api.com' });
      expect(client).toBeDefined();
    });

    it('exposes products, invoices, payments, and user modules', () => {
      const client = new BeepClient({ apiKey: 'test-key' });
      expect(client.products).toBeDefined();
      expect(client.invoices).toBeDefined();
      expect(client.payments).toBeDefined();
      expect(client.user).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('returns health status on success', async () => {
      const client = new BeepClient({ apiKey: 'test-key', serverUrl: 'https://test.api.com' });
      mockAxios.onGet('/healthz').reply(200, 'API is healthy');

      const result = await client.healthCheck();

      expect(result).toBe('API is healthy');
    });

    it('throws formatted error on Axios error', async () => {
      const client = new BeepClient({ apiKey: 'test-key', serverUrl: 'https://test.api.com' });
      mockAxios.onGet('/healthz').reply(503, { message: 'Service unavailable' });

      await expect(client.healthCheck()).rejects.toThrow('API Error: Service unavailable');
    });

    it('throws formatted error with fallback message when no response message', async () => {
      const client = new BeepClient({ apiKey: 'test-key', serverUrl: 'https://test.api.com' });
      mockAxios.onGet('/healthz').reply(500);

      await expect(client.healthCheck()).rejects.toThrow('API Error:');
    });

    it('throws generic error for non-Axios errors', async () => {
      const client = new BeepClient({ apiKey: 'test-key', serverUrl: 'https://test.api.com' });
      mockAxios.onGet('/healthz').reply(() => {
        throw new TypeError('Network failure');
      });

      await expect(client.healthCheck()).rejects.toThrow(
        'An unexpected error occurred during health check',
      );
    });
  });
});

describe('BeepPublicClient', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('constructor', () => {
    it('throws when publishable key is missing', () => {
      expect(() => new BeepPublicClient({ publishableKey: '' })).toThrow(
        'publishableKey is required',
      );
    });

    it('uses default server URL when not provided', () => {
      const client = new BeepPublicClient({ publishableKey: 'beep_pk_test' });
      expect(client).toBeDefined();
    });

    it('uses custom server URL when provided', () => {
      const client = new BeepPublicClient({
        publishableKey: 'beep_pk_test',
        serverUrl: 'https://custom.api.com',
      });
      expect(client).toBeDefined();
    });

    it('exposes widget module', () => {
      const client = new BeepPublicClient({ publishableKey: 'beep_pk_test' });
      expect(client.widget).toBeDefined();
    });
  });
});
