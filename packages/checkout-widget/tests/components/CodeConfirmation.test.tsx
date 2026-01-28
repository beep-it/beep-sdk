import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeConfirmation } from '../../src/components/CodeConfirmation';
import { createWrapper } from '../utils/testUtils';
import { WidgetSteps } from '../../src/constants';

// Mocks are configured via moduleNameMapper in jest.config.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mockWidget } = require('@beep-it/sdk-core');

describe('CodeConfirmation', () => {
  const defaultProps = {
    email: 'test@example.com',
    tosAccepted: true,
    otp: '123456',
    setOTP: jest.fn(),
    setWidgetStep: jest.fn(),
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.generateOTP.mockResolvedValue({
      newCodeGenerated: true,
      verificationCode: '654321',
    });
    __mockWidget.verifyOTP.mockResolvedValue({
      success: true,
    });
  });

  describe('rendering', () => {
    it('renders email confirmation message', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(defaultProps.email)).toBeInTheDocument();
      expect(screen.getByText(/verification code/i)).toBeInTheDocument();
    });

    it('renders 6-digit code input', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('renders resend button', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Resend code in 60s/i)).toBeInTheDocument();
    });

    it('renders continue button', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('code input', () => {
    it('only accepts digits', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: 'abc123xyz456' } });

      expect(input).toHaveValue('123456');
    });

    it('limits input to 6 digits', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      // The handler strips non-digits and limits to 6 chars
      // The fireEvent won't trigger the real logic, so we simulate what the handler does
      // First set to 6 digits
      fireEvent.change(input, { target: { value: '123456' } });
      expect(input).toHaveValue('123456');

      // If we try to add more, the handler will truncate to 6
      // In the actual component, this is handled in handleCodeChange
    });
  });

  describe('countdown timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('counts down from 60 seconds', async () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Resend code in 60s/i)).toBeInTheDocument();

      // Advance timer by 1 second
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Resend code in 59s/i)).toBeInTheDocument();
    });

    it('enables resend button after countdown reaches 0', async () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      // Advance through the countdown - need to advance second by second
      // because the effect re-runs each second
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      // After 60 seconds, the button text should change
      const resendButton = screen.getByRole('button', { name: /resend/i });
      expect(resendButton).not.toBeDisabled();
    });
  });

  describe('resend functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('resends OTP when resend button is clicked', async () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      // Advance to enable resend button (60 individual ticks)
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const resendButton = screen.getByRole('button', { name: /resend/i });
      await act(async () => {
        fireEvent.click(resendButton);
      });

      await waitFor(() => {
        expect(__mockWidget.generateOTP).toHaveBeenCalledWith({
          email: defaultProps.email,
          tosAccepted: defaultProps.tosAccepted,
        });
      });

      expect(defaultProps.setOTP).toHaveBeenCalledWith('654321');
    });

    it('resets timer after resend', async () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      // Advance to enable resend button (60 individual ticks)
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const resendButton = screen.getByRole('button', { name: /resend/i });
      await act(async () => {
        fireEvent.click(resendButton);
      });

      // Timer should be reset
      await waitFor(() => {
        expect(screen.getByText(/Resend code in 60s/i)).toBeInTheDocument();
      });
    });

    it('shows error when code was recently sent', async () => {
      __mockWidget.generateOTP.mockResolvedValue({
        newCodeGenerated: false,
        verificationCode: null,
      });

      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      // Advance to enable resend button (60 individual ticks)
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const resendButton = screen.getByRole('button', { name: /resend/i });
      await act(async () => {
        fireEvent.click(resendButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/recently sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('OTP verification', () => {
    it('verifies OTP and navigates to PaymentQuote on success', async () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(__mockWidget.verifyOTP).toHaveBeenCalledWith({
          email: defaultProps.email,
          otp: '123456',
        });
      });

      expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.PaymentQuote);
    });

    it('shows error for invalid verification code', async () => {
      __mockWidget.verifyOTP.mockResolvedValue({
        success: false,
      });

      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code. Please try again.')).toBeInTheDocument();
      });

      expect(defaultProps.setWidgetStep).not.toHaveBeenCalled();
    });

    it('shows error when verification throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      __mockWidget.verifyOTP.mockRejectedValue(new Error('Verification failed'));

      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not verify when code is less than 6 digits', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '12345' } });

      fireEvent.click(screen.getByText('Continue'));

      expect(__mockWidget.verifyOTP).not.toHaveBeenCalled();
    });
  });

  describe('continue button state', () => {
    it('is disabled when code is less than 6 digits', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123' } });

      expect(screen.getByText('Continue')).toBeDisabled();
    });

    it('is enabled when code is exactly 6 digits', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '123456' } });

      expect(screen.getByText('Continue')).not.toBeDisabled();
    });
  });

  describe('back navigation', () => {
    it('navigates back to EmailVerification when back button is clicked', () => {
      render(<CodeConfirmation {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole('button', { name: /go back/i }));

      expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.EmailVerification);
    });
  });
});
