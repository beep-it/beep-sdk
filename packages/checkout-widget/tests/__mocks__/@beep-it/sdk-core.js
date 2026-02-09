/**
 * Mock for @beep-it/sdk-core
 * Provides controllable mock implementations for BeepPublicClient.widget methods
 */

const mockWidget = {
  createPaymentSession: jest.fn().mockResolvedValue({
    referenceKey: 'mock-ref-key',
    paymentUrl: 'sui:mock-payment-url',
    qrCode: 'data:image/png;base64,mockQrCode',
    amount: '25.00',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'pending',
    isCashPaymentEligible: true,
    destinationAddress: 'mock-destination-address',
  }),
  getPaymentStatus: jest.fn().mockResolvedValue({
    paid: false,
    status: 'pending',
  }),
  generateOTP: jest.fn().mockResolvedValue({
    verificationCode: '123456',
    newCodeGenerated: true,
  }),
  verifyOTP: jest.fn().mockResolvedValue({
    success: true,
  }),
  generatePaymentQuote: jest.fn().mockResolvedValue({
    fiatAmount: '25.50',
    networkFee: '0.50',
    rampFee: '1.00',
    supportedPaymentMethods: [
      {
        country: 'US',
        payWayCode: 'VISA_MASTER_CARD',
        minPurchaseAmount: '10.00',
        maxPurchaseAmount: '1000.00',
      },
    ],
  }),
  createCashPaymentOrder: jest.fn().mockResolvedValue({
    payUrl: 'https://payment.example.com/order/123',
  }),
  getDynamicEnv: jest.fn().mockResolvedValue({
    environmentId: 'mock-environment-id',
  }),
  getProducts: jest.fn().mockResolvedValue({
    products: [],
  }),
  waitForPaid: jest.fn().mockResolvedValue({
    paid: false,
    last: { paid: false, status: 'pending' },
  }),
};

class MockBeepPublicClient {
  constructor(options) {
    this.publishableKey = options.publishableKey;
    this.serverUrl = options.serverUrl;
  }

  widget = mockWidget;
}

// Helper to reset all mocks
const resetAllMocks = () => {
  Object.values(mockWidget).forEach((mockFn) => {
    if (typeof mockFn === 'function' && mockFn.mockReset) {
      mockFn.mockReset();
    }
  });
};

// Helper to set default successful responses
const setDefaultResponses = () => {
  mockWidget.createPaymentSession.mockResolvedValue({
    referenceKey: 'mock-ref-key',
    paymentUrl: 'sui:mock-payment-url',
    qrCode: 'data:image/png;base64,mockQrCode',
    amount: '25.00',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'pending',
    isCashPaymentEligible: true,
    destinationAddress: 'mock-destination-address',
  });
  mockWidget.getPaymentStatus.mockResolvedValue({
    paid: false,
    status: 'pending',
  });
  mockWidget.generateOTP.mockResolvedValue({
    verificationCode: '123456',
    newCodeGenerated: true,
  });
  mockWidget.verifyOTP.mockResolvedValue({
    success: true,
  });
  mockWidget.generatePaymentQuote.mockResolvedValue({
    fiatAmount: '25.50',
    networkFee: '0.50',
    rampFee: '1.00',
    supportedPaymentMethods: [
      {
        country: 'US',
        payWayCode: 'VISA_MASTER_CARD',
        minPurchaseAmount: '10.00',
        maxPurchaseAmount: '1000.00',
      },
    ],
  });
  mockWidget.createCashPaymentOrder.mockResolvedValue({
    payUrl: 'https://payment.example.com/order/123',
  });
  mockWidget.getDynamicEnv.mockResolvedValue({
    environmentId: 'mock-environment-id',
  });
};

module.exports = {
  BeepPublicClient: MockBeepPublicClient,
  __mockWidget: mockWidget,
  __resetAllMocks: resetAllMocks,
  __setDefaultResponses: setDefaultResponses,
};
