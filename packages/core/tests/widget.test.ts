import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepPublicClient } from '../src';

describe('Widget Module', () => {
  let client: BeepPublicClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    client = new BeepPublicClient({
      publishableKey: 'beep_pk_test_key',
      serverUrl: 'https://test-api.beep.com',
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('createPaymentSession', () => {
    it('creates a payment session with assets', async () => {
      const mockResponse = {
        referenceKey: 'ref_abc123',
        paymentUrl: 'sui:pay?recipient=0xabc',
        qrCode: 'data:image/png;base64,abc',
        amount: '25.00',
        expiresAt: '2025-12-31T23:59:59Z',
        status: 'PENDING',
        isCashPaymentEligible: false,
        destinationAddress: '0xabc',
      };

      mockAxios.onPost('/v1/widget/payment-session').reply(200, mockResponse);

      const result = await client.widget.createPaymentSession({
        assets: [{ name: 'Test Item', price: '25.00', quantity: 1 }],
        paymentLabel: 'My Store',
      });

      expect(result).toEqual(mockResponse);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.assets).toEqual([{ name: 'Test Item', price: '25.00', quantity: 1 }]);
      expect(requestData.paymentLabel).toBe('My Store');
      expect(requestData.generateQrCode).toBe(true);
    });

    it('defaults generateQrCode to true when not specified', async () => {
      mockAxios.onPost('/v1/widget/payment-session').reply(200, {
        referenceKey: 'ref_123',
        paymentUrl: 'sui:pay?recipient=0xabc',
        amount: '10.00',
        expiresAt: '2025-12-31T23:59:59Z',
        status: 'PENDING',
        isCashPaymentEligible: false,
        destinationAddress: '0xabc',
      });

      await client.widget.createPaymentSession({
        assets: [{ assetId: 'prod_123', quantity: 1 }],
      });

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.generateQrCode).toBe(true);
    });

    it('respects generateQrCode when explicitly set to false', async () => {
      mockAxios.onPost('/v1/widget/payment-session').reply(200, {
        referenceKey: 'ref_123',
        paymentUrl: 'sui:pay?recipient=0xabc',
        amount: '10.00',
        expiresAt: '2025-12-31T23:59:59Z',
        status: 'PENDING',
        isCashPaymentEligible: false,
        destinationAddress: '0xabc',
      });

      await client.widget.createPaymentSession({
        assets: [{ assetId: 'prod_123', quantity: 1 }],
        generateQrCode: false,
      });

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.generateQrCode).toBe(false);
    });
  });

  describe('generateOTP', () => {
    it('generates an OTP for the given email', async () => {
      const mockResponse = { newCodeGenerated: true, verificationCode: '123456' };
      mockAxios.onPost('/v1/widget/generate-otp').reply(200, mockResponse);

      const result = await client.widget.generateOTP({
        email: 'test@example.com',
        tosAccepted: true,
      });

      expect(result).toEqual(mockResponse);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.email).toBe('test@example.com');
      expect(requestData.tosAccepted).toBe(true);
    });
  });

  describe('verifyOTP', () => {
    it('verifies an OTP', async () => {
      const mockResponse = { success: true };
      mockAxios.onPost('/v1/widget/verify-otp').reply(200, mockResponse);

      const result = await client.widget.verifyOTP({ email: 'test@example.com', otp: '123456' });

      expect(result).toEqual(mockResponse);
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.email).toBe('test@example.com');
      expect(requestData.otp).toBe('123456');
    });
  });

  describe('generatePaymentQuote', () => {
    it('generates a payment quote', async () => {
      const mockResponse = {
        fiatAmount: '25.50',
        networkFee: '0.01',
        rampFee: '0.50',
        supportedPaymentMethods: [],
      };
      mockAxios.onPost('/v1/widget/generate-payment-quote').reply(200, mockResponse);

      const result = await client.widget.generatePaymentQuote({
        amount: '25.00',
        walletAddress: '0xabc123',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('createCashPaymentOrder', () => {
    it('creates a cash payment order', async () => {
      const mockResponse = { payUrl: 'https://pay.example.com/order/123' };
      mockAxios.onPost('/v1/widget/create-cash-payment-order').reply(200, mockResponse);

      const result = await client.widget.createCashPaymentOrder({
        reference: 'ref_123',
        walletAddress: '0xabc',
        amount: '50.00',
        payWayCode: 10001 as any,
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPaymentStatus', () => {
    it('retrieves payment status for a reference key', async () => {
      const mockResponse = { paid: true, status: 'COMPLETED' };
      mockAxios.onGet('/v1/widget/payment-status/ref_abc123').reply(200, mockResponse);

      const result = await client.widget.getPaymentStatus('ref_abc123');

      expect(result).toEqual(mockResponse);
    });

    it('encodes the reference key in the URL', async () => {
      const mockResponse = { paid: false, status: 'PENDING' };
      mockAxios.onGet('/v1/widget/payment-status/ref%20with%20spaces').reply(200, mockResponse);

      const result = await client.widget.getPaymentStatus('ref with spaces');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('waitForPaid', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns paid:true when status becomes paid', async () => {
      mockAxios
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(200, { paid: false, status: 'PENDING' })
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(200, { paid: true, status: 'COMPLETED' });

      const promise = client.widget.waitForPaid({
        referenceKey: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
      });

      // Advance past the first poll interval
      await jest.advanceTimersByTimeAsync(100);
      // Advance past the second poll interval
      await jest.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result.paid).toBe(true);
      expect(result.last?.paid).toBe(true);
    });

    it('returns paid:false on timeout', async () => {
      mockAxios
        .onGet(/\/v1\/widget\/payment-status\//)
        .reply(200, { paid: false, status: 'PENDING' });

      const promise = client.widget.waitForPaid({
        referenceKey: 'ref_123',
        intervalMs: 100,
        timeoutMs: 250,
      });

      // Advance timers until timeout
      await jest.advanceTimersByTimeAsync(300);

      const result = await promise;
      expect(result.paid).toBe(false);
    });

    it('returns paid:false when signal is aborted', async () => {
      const controller = new AbortController();
      mockAxios
        .onGet(/\/v1\/widget\/payment-status\//)
        .reply(200, { paid: false, status: 'PENDING' });

      controller.abort();

      const result = await client.widget.waitForPaid({
        referenceKey: 'ref_123',
        intervalMs: 100,
        signal: controller.signal,
      });

      expect(result.paid).toBe(false);
    });

    it('calls onUpdate callback on each poll', async () => {
      const onUpdate = jest.fn();
      mockAxios
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(200, { paid: false, status: 'PENDING' })
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(200, { paid: true, status: 'COMPLETED' });

      const promise = client.widget.waitForPaid({
        referenceKey: 'ref_123',
        intervalMs: 100,
        timeoutMs: 5000,
        onUpdate,
      });

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);

      await promise;
      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ paid: false }));
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ paid: true }));
    });

    it('calls onError and aborts on fatal HTTP status (404)', async () => {
      const onError = jest.fn();
      mockAxios.onGet(/\/v1\/widget\/payment-status\//).reply(404, { error: 'Not found' });

      const promise = client.widget.waitForPaid({
        referenceKey: 'ref_invalid',
        intervalMs: 100,
        timeoutMs: 5000,
        onError,
      });

      // Let the first poll resolve
      await jest.advanceTimersByTimeAsync(0);

      const result = await promise;
      expect(result.paid).toBe(false);
      expect(onError).toHaveBeenCalled();
    });

    it('applies exponential backoff on transient errors (500)', async () => {
      const onError = jest.fn();
      mockAxios
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(500, { error: 'Server error' })
        .onGet(/\/v1\/widget\/payment-status\//)
        .replyOnce(200, { paid: true, status: 'COMPLETED' });

      const promise = client.widget.waitForPaid({
        referenceKey: 'ref_123',
        intervalMs: 100,
        timeoutMs: 10000,
        onError,
      });

      // First poll fails (500) - then waits ceil(100 * 1.5) = 150ms
      await jest.advanceTimersByTimeAsync(150);
      // Second poll succeeds
      await jest.advanceTimersByTimeAsync(150);

      const result = await promise;
      expect(result.paid).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDynamicEnv', () => {
    it('retrieves the dynamic environment ID', async () => {
      const mockResponse = { environmentId: 'env_abc123' };
      mockAxios.onGet('/v1/widget/environment').reply(200, mockResponse);

      const result = await client.widget.getDynamicEnv();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProducts', () => {
    it('retrieves the products list', async () => {
      const mockResponse = {
        products: [
          {
            uuid: 'prod_123',
            merchantId: 'merch_456',
            name: 'Test Product',
            description: null,
            active: true,
            images: [],
            metadata: {},
            prices: [
              {
                uuid: 'price_789',
                token: 'USDC',
                chain: 'SUI',
                amount: '1000000',
                unitType: 'one-time',
                unitAmount: '1000000',
                unitSize: 1,
                active: true,
              },
            ],
          },
        ],
      };
      mockAxios.onGet('/v1/widget/products').reply(200, mockResponse);

      const result = await client.widget.getProducts();

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Test Product');
    });
  });
});
