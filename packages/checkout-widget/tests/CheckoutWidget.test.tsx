// @ts-ignore
import { BeepClient } from '@beep/sdk-core';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { CheckoutWidget } from '../src/CheckoutWidget';

// Mock the BeepClient
jest.mock('@beep/sdk-core');
const MockedBeepClient = BeepClient as jest.MockedClass<typeof BeepClient>;

describe('CheckoutWidget', () => {
  const defaultProps = {
    merchantId: 'test-merchant-123',
    amount: 25.5,
    primaryColor: '#007bff',
    labels: {
      scanQr: 'Scan QR Code to Pay',
    },
    apiKey: 'test-api-key',
  };

  let mockRequestPayment: jest.Mock;

  beforeEach(() => {
    mockRequestPayment = jest.fn();
    
    MockedBeepClient.mockClear();
    MockedBeepClient.mockImplementation(() => ({
      payments: {
        requestAndPurchaseAsset: mockRequestPayment,
      },
    } as any));
  });

  it('renders loading state initially', () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl: 'test-url',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    render(<CheckoutWidget {...defaultProps} />);

    expect(screen.getByText('Loading payment...')).toBeInTheDocument();
  });

  it('renders QR code after successful payment request', async () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl: 'test-url',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    render(<CheckoutWidget {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
      expect(screen.getByAltText('QR Code for payment')).toBeInTheDocument();
      expect(screen.getByText('Amount: $25.50')).toBeInTheDocument();
    });

    expect(mockRequestPayment).toHaveBeenCalledWith({
      assetIds: ['asset_1'],
    });
  });

  it('renders error state when payment request fails', async () => {
    mockRequestPayment.mockRejectedValue(new Error('Network error'));

    render(<CheckoutWidget {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('uses custom server URL when provided', async () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl: 'test-url',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    const customServerUrl = 'https://custom-server.com';
    render(<CheckoutWidget {...defaultProps} serverUrl={customServerUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    });

    expect(MockedBeepClient).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      serverUrl: customServerUrl,
    });
  });
});
