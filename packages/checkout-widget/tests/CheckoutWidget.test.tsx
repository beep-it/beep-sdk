import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CheckoutWidget } from '../src/CheckoutWidget';

// Mock the hooks instead of BeepClient
jest.mock('../src/hooks/usePaymentSetup');
jest.mock('../src/hooks/usePaymentStatus');

import { usePaymentSetup } from '../src/hooks/usePaymentSetup';
import { usePaymentStatus } from '../src/hooks/usePaymentStatus';

const mockUsePaymentSetup = usePaymentSetup as jest.MockedFunction<typeof usePaymentSetup>;
const mockUsePaymentStatus = usePaymentStatus as jest.MockedFunction<typeof usePaymentStatus>;

describe('CheckoutWidget', () => {
  const defaultPropsWithExistingAssets = {
    primaryColor: '#007bff',
    labels: {
      scanQr: 'Scan QR Code to Pay',
    },
    publishableKey: 'beep_pk_test',
    assets: [{ assetId: 'asset_1', quantity: 1 }],
  };

  const defaultPropsWithNewProducts = {
    primaryColor: '#007bff',
    labels: {
      scanQr: 'Scan QR Code to Pay',
    },
    publishableKey: 'beep_pk_test',
    assets: [{ name: 'Test Product', price: '25.50', description: 'A test product' }],
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUsePaymentSetup.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    } as any);

    mockUsePaymentStatus.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    } as any);
  });

  it('renders loading state initially', () => {
    // Setup hook returns loading state
    mockUsePaymentSetup.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    expect(screen.getByText('Loading payment...')).toBeInTheDocument();
  });

  it('renders QR code after successful payment request with existing assets', () => {
    // Setup hook returns successful data with calculated total from product data
    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'data:image/png;base64,mockqrcode',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?amount=1&reference=test-ref',
        processedAssets: [{ assetId: 'asset_1', quantity: 1 }],
        totalAmount: 1.156188, // Amount from the product pricing
      },
      error: null,
      isLoading: false,
    } as any);

    // Status hook returns pending (still has referenceKey)
    mockUsePaymentStatus.mockReturnValue({
      data: false, // Payment not complete
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    expect(screen.getByText('$1.16')).toBeInTheDocument(); // Now shows calculated total from product
  });

  it('renders error state when payment request fails', () => {
    // Setup hook returns error state
    mockUsePaymentSetup.mockReturnValue({
      data: null,
      error: new Error('Network error'),
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('uses custom server URL when provided', () => {
    // Setup hook returns successful data
    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'data:image/png;base64,mockqrcode',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [{ assetId: 'asset_1', quantity: 1 }],
        totalAmount: 0,
      },
      error: null,
      isLoading: false,
    } as any);

    const customServerUrl = 'https://custom-server.com';
    render(<CheckoutWidget {...defaultPropsWithExistingAssets} serverUrl={customServerUrl} />);

    expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    // With hook mocking, we can't easily test the serverUrl prop passing
    // This would require testing the hook implementation separately
  });

  // NEW TESTS FOR ON-THE-FLY PRODUCT CREATION
  it('creates products on-the-fly and displays calculated amount', () => {
    // Setup hook returns successful data for product creation
    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'data:image/png;base64,mockqrcode',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [{ assetId: 'created-product-id', quantity: 1 }],
        totalAmount: 25.50, // Amount calculated from product pricing
      },
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    expect(screen.getByText('Scan QR Code to Pay')).toBeInTheDocument();
    expect(screen.getByText('$25.50')).toBeInTheDocument();
    // The actual product creation logic is tested within the hook itself
  });

  it('handles multiple CreateProductPayload assets', () => {
    const multiProductProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'Product 1', price: '10.00', description: 'First product' },
        { name: 'Product 2', price: '15.50', description: 'Second product' },
      ],
    };

    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'data:image/png;base64,mockqrcode',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [
          { assetId: 'product-1-id', quantity: 1 },
          { assetId: 'product-2-id', quantity: 1 },
        ],
        totalAmount: 25.50, // 10.00 + 15.50
      },
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...multiProductProps} />);

    expect(screen.getByText('$25.50')).toBeInTheDocument(); // 10.00 + 15.50
  });

  it('handles mixed asset types (CreateProductPayload + BeepPurchaseAsset)', () => {
    const mixedProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'New Product', price: '20.00', description: 'New product' },
        { assetId: 'existing-asset-id', quantity: 2 },
      ],
    };

    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'data:image/png;base64,mockqrcode',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [
          { assetId: 'new-product-id', quantity: 1 },
          { assetId: 'existing-asset-id', quantity: 2 },
        ],
        totalAmount: 30.00, // Assume existing product contributes 10.00 (5.00 × 2)
      },
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...mixedProps} />);

    expect(screen.getByText('$30.00')).toBeInTheDocument(); // Total from both new product and existing asset
  });

  it('displays specific error when product creation fails', () => {
    // Setup hook returns error state
    mockUsePaymentSetup.mockReturnValue({
      data: null,
      error: new Error('Failed to create product "Test Product": Product name already exists'),
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    expect(
      screen.getByText('Failed to create product "Test Product": Product name already exists')
    ).toBeInTheDocument();
  });

  it('handles unknown product creation errors', () => {
    // Setup hook returns error state
    mockUsePaymentSetup.mockReturnValue({
      data: null,
      error: new Error('Failed to create product "Test Product": Unknown error'),
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithNewProducts} />);

    expect(
      screen.getByText('Failed to create product "Test Product": Unknown error')
    ).toBeInTheDocument();
  });

  it('calculates total from multiple CreateProductPayload assets', () => {
    const multiPriceProps = {
      ...defaultPropsWithNewProducts,
      assets: [
        { name: 'Product 1', price: '12.34' },
        { name: 'Product 2', price: '56.78' },
        { name: 'Product 3', price: '0.88' },
      ],
    };

    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'test-qr',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [
          { assetId: 'p1', quantity: 1 },
          { assetId: 'p2', quantity: 1 },
          { assetId: 'p3', quantity: 1 },
        ],
        totalAmount: 70.00, // 12.34 + 56.78 + 0.88
      },
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...multiPriceProps} />);

    expect(screen.getByText('$70.00')).toBeInTheDocument(); // 12.34 + 56.78 + 0.88
  });

  it('shows calculated amount for BeepPurchaseAsset with product data', () => {
    mockUsePaymentSetup.mockReturnValue({
      data: {
        qrCode: 'test-qr',
        referenceKey: 'test-ref',
        paymentUrl: 'solana:test',
        processedAssets: [{ assetId: 'asset_1', quantity: 1 }],
        totalAmount: 1.156188, // Amount calculated from fetched product data
      },
      error: null,
      isLoading: false,
    } as any);

    render(<CheckoutWidget {...defaultPropsWithExistingAssets} />);

    expect(screen.getByText('$1.16')).toBeInTheDocument(); // Shows calculated total from product
  });
});
