import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentQuote } from '../../src/components/PaymentQuote';
import { createWrapper } from '../utils/testUtils';
import { WidgetSteps } from '../../src/constants';

// Mocks are configured via moduleNameMapper in jest.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('PaymentQuote', () => {
  const defaultProps = {
    reference: 'ref-123',
    email: 'test@example.com',
    amount: '25.50',
    walletAddress: 'wallet-address-123',
    setWidgetStep: jest.fn(),
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  // PayWayCode enum values from @beep-it/sdk-core
  const PayWayCode = {
    VISA_MASTER_CARD: '10001',
    APPLE_PAY: '501',
    GOOGLE_PAY: '701',
    NETELLER: '52004',
    SKRILL: '52005',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.generatePaymentQuote.mockResolvedValue({
      fiatAmount: '26.50',
      networkFee: '0.50',
      rampFee: '0.50',
      supportedPaymentMethods: [
        {
          country: 'US',
          payWayCode: PayWayCode.VISA_MASTER_CARD,
          minPurchaseAmount: '10.00',
          maxPurchaseAmount: '1000.00',
        },
        {
          country: 'US',
          payWayCode: PayWayCode.APPLE_PAY,
          minPurchaseAmount: '5.00',
          maxPurchaseAmount: '500.00',
        },
      ],
    });
    __mockWidget.createCashPaymentOrder.mockResolvedValue({
      payUrl: 'https://payment.example.com/checkout',
    });
  });

  describe('rendering', () => {
    it('renders title', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Pay with cash')).toBeInTheDocument();
    });

    it('renders fiat amount when loaded', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('26.50')).toBeInTheDocument();
      });
    });

    it('renders loading state initially', () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('renders payment methods', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Visa / MasterCard')).toBeInTheDocument();
        expect(screen.getByText('Apple Pay')).toBeInTheDocument();
      });
    });

    it('renders back button', () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('renders continue button', () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Continue to checkout')).toBeInTheDocument();
    });
  });

  describe('countdown timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('displays refresh countdown', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Quote refreshes in 15s/i)).toBeInTheDocument();
      });
    });

    it('counts down each second', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Quote refreshes in 15s/i)).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Quote refreshes in 14s/i)).toBeInTheDocument();
    });

    it('auto-refreshes quote when countdown reaches 0', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(__mockWidget.generatePaymentQuote).toHaveBeenCalled();
      });

      const initialCallCount = __mockWidget.generatePaymentQuote.mock.calls.length;

      // Advance timer by 15 seconds (individual ticks)
      for (let i = 0; i < 15; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      // Should have made another call via react-query refetch
      await waitFor(() => {
        expect(__mockWidget.generatePaymentQuote.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it('resets timer when payment method changes', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      // Wait for methods to load
      await waitFor(() => {
        expect(screen.getByText('Apple Pay')).toBeInTheDocument();
      });

      // Advance timer by 10 seconds (individual ticks)
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      expect(screen.getByText(/Quote refreshes in 5s/i)).toBeInTheDocument();

      // Select different payment method
      const applePayRadio = screen.getByRole('radio', { name: /Apple Pay/i });
      await act(async () => {
        fireEvent.click(applePayRadio);
      });

      // Timer should be reset to 15
      expect(screen.getByText(/Quote refreshes in 15s/i)).toBeInTheDocument();
    });
  });

  describe('payment method selection', () => {
    it('defaults to VISA_MASTER_CARD', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Visa / MasterCard')).toBeInTheDocument();
      });

      const visaRadio = screen.getByRole('radio', { name: /Visa \/ MasterCard/i });
      expect(visaRadio).toBeChecked();
    });

    it('allows selecting different payment method', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Apple Pay')).toBeInTheDocument();
      });

      const applePayRadio = screen.getByRole('radio', { name: /Apple Pay/i });
      fireEvent.click(applePayRadio);

      expect(applePayRadio).toBeChecked();
    });

    it('filters out unsupported payment methods', async () => {
      __mockWidget.generatePaymentQuote.mockResolvedValue({
        fiatAmount: '26.50',
        networkFee: '0.50',
        rampFee: '0.50',
        supportedPaymentMethods: [
          {
            country: 'US',
            payWayCode: PayWayCode.VISA_MASTER_CARD,
            minPurchaseAmount: '10.00',
            maxPurchaseAmount: '1000.00',
          },
          {
            country: 'US',
            payWayCode: 'UNKNOWN_METHOD', // Not a valid PayWayCode
            minPurchaseAmount: '10.00',
            maxPurchaseAmount: '1000.00',
          },
        ],
      });

      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Visa / MasterCard')).toBeInTheDocument();
      });

      // Unknown method should not be rendered
      expect(screen.queryByText('UNKNOWN_METHOD')).not.toBeInTheDocument();
    });
  });

  describe('continue button', () => {
    it('is disabled when loading', () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Continue to checkout')).toBeDisabled();
    });

    it('is enabled when data is loaded', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Continue to checkout')).not.toBeDisabled();
      });
    });

    it('creates cash payment order and redirects on continue', async () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Continue to checkout')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Continue to checkout'));

      await waitFor(() => {
        expect(__mockWidget.createCashPaymentOrder).toHaveBeenCalledWith({
          amount: '26.50',
          email: defaultProps.email,
          walletAddress: defaultProps.walletAddress,
          reference: defaultProps.reference,
          payWayCode: PayWayCode.VISA_MASTER_CARD,
        });
      });

      // Redirect is triggered via window.location.href = payUrl
      // We verify the API call above; jsdom 26 doesn't support intercepting location.href assignment
    });
  });

  describe('error handling', () => {
    it('displays error message when quote fails to load', async () => {
      __mockWidget.generatePaymentQuote.mockRejectedValue(new Error('Failed to load quote'));

      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Failed to load quote')).toBeInTheDocument();
      });
    });
  });

  describe('back navigation', () => {
    it('navigates back to CodeConfirmation when back button is clicked', () => {
      render(<PaymentQuote {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole('button', { name: /go back/i }));

      expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.CodeConfirmation);
    });
  });
});
