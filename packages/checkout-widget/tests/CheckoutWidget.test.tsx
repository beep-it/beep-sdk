import { BeepClient } from '@beep-it/sdk-core';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CheckoutWidget } from '../src/CheckoutWidget';

// Mock the BeepClient
jest.mock('@beep-it/sdk-core');
const MockedBeepClient = BeepClient as jest.MockedClass<typeof BeepClient>;

describe('CheckoutWidget', () => {
  const defaultPropsWithExistingAssets = {
    primaryColor: '#007bff',
    labels: {
      scanQr: 'Scan QR Code to Pay',
    },
    apiKey: 'test-api-key',
    assets: [{ assetId: 'asset_1', quantity: 1 }],
  };

  const defaultPropsWithNewProducts = {
    primaryColor: '#007bff',
    labels: {
      scanQr: 'Scan QR Code to Pay',
    },
    apiKey: 'test-api-key',
    assets: [{ name: 'Test Product', price: '25.50', description: 'A test product' }],
  };

  let mockRequestPayment: jest.Mock;
  let mockCreateProduct: jest.Mock;

  beforeEach(() => {
    mockRequestPayment = jest.fn();
    mockCreateProduct = jest.fn();

    MockedBeepClient.mockClear();
    MockedBeepClient.mockImplementation(
      () =>
        ({
          payments: {
            requestAndPurchaseAsset: mockRequestPayment,
          },
          products: {
            createProduct: mockCreateProduct,
          },
        }) as any,
    );
  });

  it('renders loading state initially', () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl:
        'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&reference=test-ref&label=Test%20Payment',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    expect(screen.getByText('Loading payment...')).toBeInTheDocument();
  });

  it('renders QR code after successful payment request with existing assets', async () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl:
        'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&reference=test-ref&label=Test%20Payment',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // Can't calculate from BeepPurchaseAsset
    });

    expect(mockRequestPayment).toHaveBeenCalledWith({
      assets: [{ assetId: 'asset_1', quantity: 1 }],
      generateQrCode: true,
    });
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it('renders error state when payment request fails', async () => {
    mockRequestPayment.mockRejectedValue(new Error('Network error'));

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('uses custom server URL when provided', async () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl:
        'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&reference=test-ref&label=Test%20Payment',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    const customServerUrl = 'https://custom-server.com';
    render(<CheckoutWidget {...defaultPropsWithExistingAssets} serverUrl={customServerUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    });

    expect(MockedBeepClient).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      serverUrl: customServerUrl,
    });
  });

  // NEW TESTS FOR ON-THE-FLY PRODUCT CREATION
  it('creates products on-the-fly and displays calculated amount', async () => {
    mockCreateProduct.mockResolvedValue({
      id: 'created-product-id',
      name: 'Test Product',
      price: '2550', // price in base units
      description: 'A test product',
    });

    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      invoiceId: 'test-invoice',
      referenceKey: 'test-ref',
      paymentUrl:
        'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&reference=test-ref&label=Test%20Payment',
      amount: 2550000,
      splTokenAddress: 'test-token',
      expiresAt: new Date(),
      receivingMerchantId: 'test-merchant-123',
      status: 'pending',
    });

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
      expect(screen.getByText('$25.50')).toBeInTheDocument();
    });

    expect(mockCreateProduct).toHaveBeenCalledWith({
      name: 'Test Product',
      price: '25.50',
      description: 'A test product',
    });

    expect(mockRequestPayment).toHaveBeenCalledWith({
      assets: [{ assetId: 'created-product-id', quantity: 1 }],
      generateQrCode: true,
    });
  });

  it('handles multiple CreateProductPayload assets', async () => {
    const multiProductProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'Product 1', price: '10.00', description: 'First product' },
        { name: 'Product 2', price: '15.50', description: 'Second product' },
      ],
    };

    mockCreateProduct
      .mockResolvedValueOnce({ id: 'product-1-id', name: 'Product 1' })
      .mockResolvedValueOnce({ id: 'product-2-id', name: 'Product 2' });

    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      referenceKey: 'test-ref',
      paymentUrl: 'solana:test',
    });

    render(<CheckoutWidget {...multiProductProps} />);

    await waitFor(() => {
      expect(screen.getByText('$25.50')).toBeInTheDocument(); // 10.00 + 15.50
    });

    expect(mockCreateProduct).toHaveBeenCalledTimes(2);
    expect(mockRequestPayment).toHaveBeenCalledWith({
      assets: [
        { assetId: 'product-1-id', quantity: 1 },
        { assetId: 'product-2-id', quantity: 1 },
      ],
      generateQrCode: true,
    });
  });

  it('handles mixed asset types (CreateProductPayload + BeepPurchaseAsset)', async () => {
    const mixedProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'New Product', price: '20.00', description: 'New product' },
        { assetId: 'existing-asset-id', quantity: 2 },
      ],
    };

    mockCreateProduct.mockResolvedValue({
      id: 'new-product-id',
      name: 'New Product',
    });

    mockRequestPayment.mockResolvedValue({
      qrCode: 'data:image/png;base64,mockqrcode',
      referenceKey: 'test-ref',
      paymentUrl: 'solana:test',
    });

    render(<CheckoutWidget {...mixedProps} />);

    await waitFor(() => {
      expect(screen.getByText('$20.00')).toBeInTheDocument(); // Only new product contributes to total
    });

    expect(mockCreateProduct).toHaveBeenCalledTimes(1);
    expect(mockRequestPayment).toHaveBeenCalledWith({
      assets: [
        { assetId: 'new-product-id', quantity: 1 },
        { assetId: 'existing-asset-id', quantity: 2 },
      ],
      generateQrCode: true,
    });
  });

  it('displays specific error when product creation fails', async () => {
    mockCreateProduct.mockRejectedValue(new Error('Product name already exists'));

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    await waitFor(() => {
      expect(
        screen.getByText('Error: Failed to create product "Test Product": Product name already exists')
      ).toBeInTheDocument();
    });

    expect(mockCreateProduct).toHaveBeenCalledWith({
      name: 'Test Product',
      price: '25.50',
      description: 'A test product',
    });
    expect(mockRequestPayment).not.toHaveBeenCalled();
  });

  it('handles unknown product creation errors', async () => {
    mockCreateProduct.mockRejectedValue('Unknown error');

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    await waitFor(() => {
      expect(
        screen.getByText('Error: Failed to create product "Test Product": Unknown error')
      ).toBeInTheDocument();
    });
  });

  it('calculates total from multiple CreateProductPayload assets', async () => {
    const multiPriceProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'Product 1', price: '12.34' },
        { name: 'Product 2', price: '56.78' },
        { name: 'Product 3', price: '0.88' },
      ],
    };

    mockCreateProduct
      .mockResolvedValueOnce({ id: 'p1' })
      .mockResolvedValueOnce({ id: 'p2' })
      .mockResolvedValueOnce({ id: 'p3' });

    mockRequestPayment.mockResolvedValue({
      qrCode: 'test-qr',
      referenceKey: 'test-ref',
      paymentUrl: 'solana:test',
    });

    render(<CheckoutWidget {...multiPriceProps} />);

    await waitFor(() => {
      expect(screen.getByText('$70.00')).toBeInTheDocument(); // 12.34 + 56.78 + 0.88
    });
  });

  it('shows $0.00 for BeepPurchaseAsset-only assets', async () => {
    mockRequestPayment.mockResolvedValue({
      qrCode: 'test-qr',
      referenceKey: 'test-ref',
      paymentUrl: 'solana:test',
    });

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });
});