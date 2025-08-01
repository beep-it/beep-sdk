// @ts-ignore
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { CheckoutWidget } from '../src/CheckoutWidget';
import { BeepClient } from '@beep/sdk-core';

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

  beforeEach(() => {
    MockedBeepClient.mockClear();
  });

  it('renders loading state initially', () => {
    const mockRequestPayment = jest.fn().mockResolvedValue({
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

    MockedBeepClient.prototype.requestPayment = mockRequestPayment;

    render(<CheckoutWidget {...defaultProps} />);

    expect(screen.getByText('Loading payment...')).toBeInTheDocument();
  });

  it('renders QR code after successful payment request', async () => {
    const mockRequestPayment = jest.fn().mockResolvedValue({
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

    MockedBeepClient.prototype.requestPayment = mockRequestPayment;

    render(<CheckoutWidget {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
      expect(screen.getByAltText('QR Code for payment')).toBeInTheDocument();
      expect(screen.getByText('Amount: $25.50')).toBeInTheDocument();
    });

    expect(mockRequestPayment).toHaveBeenCalledWith({
      amount: 25.5,
      description: 'Payment for merchant test-merchant-123',
    });
  });

  it('renders error state when payment request fails', async () => {
    const mockRequestPayment = jest.fn().mockRejectedValue(new Error('Network error'));
    MockedBeepClient.prototype.requestPayment = mockRequestPayment;

    render(<CheckoutWidget {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('uses custom server URL when provided', async () => {
    const mockRequestPayment = jest.fn().mockResolvedValue({
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

    MockedBeepClient.prototype.requestPayment = mockRequestPayment;

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
