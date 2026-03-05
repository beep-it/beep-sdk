import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient } from '../src';
import { SupportedToken } from '../src/types';

describe('Invoices Module', () => {
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

  it('createInvoice creates a product-based invoice', async () => {
    const mockInvoice = {
      id: 'inv_test123',
      productId: 'prod_test123',
      status: 'pending',
      payerType: 'customer_wallet',
      // other fields...
    };

    mockAxios.onPost('/v1/invoices').reply(200, mockInvoice);

    const result = await client.invoices.createInvoice({
      productId: 'prod_test123',
      payerType: 'customer_wallet',
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
      token: SupportedToken.USDC,
      payerType: 'customer_wallet',
      // other fields...
    };

    mockAxios.onPost('/v1/invoices').reply(200, mockInvoice);

    const result = await client.invoices.createInvoice({
      amount: '25.99',
      token: SupportedToken.USDC,
      description: 'Custom invoice',
      payerType: 'customer_wallet',
    });

    expect(result).toEqual(mockInvoice);

    const requestData = JSON.parse(mockAxios.history.post[0].data);
    expect(requestData.token).toBe(SupportedToken.USDC);
    expect(requestData.payerType).toBe('customer_wallet');
  });

  it('getInvoice returns an invoice by ID', async () => {
    const mockInvoice = {
      id: 'inv_test123',
      status: 'pending',
      // other fields...
    };

    mockAxios.onGet('/v1/invoices/inv_test123').reply(200, mockInvoice);

    const result = await client.invoices.getInvoice('inv_test123');
    expect(result).toEqual(mockInvoice);
  });

  it('listInvoices returns all invoices', async () => {
    const mockInvoices = [
      { id: 'inv_1', status: 'paid' },
      { id: 'inv_2', status: 'pending' },
    ];

    mockAxios.onGet('/v1/invoices').reply(200, mockInvoices);

    const result = await client.invoices.listInvoices();
    expect(result).toEqual(mockInvoices);
  });

  it('deleteInvoice deletes an invoice', async () => {
    mockAxios.onDelete('/v1/invoices/inv_test123').reply(200, { deleted: true });

    await client.invoices.deleteInvoice('inv_test123');

    expect(mockAxios.history.delete.length).toBe(1);
    expect(mockAxios.history.delete[0].url).toBe('/v1/invoices/inv_test123');
  });
});
