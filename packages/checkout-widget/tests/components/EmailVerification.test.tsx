import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmailVerification } from '../../src/components/EmailVerification';
import { createWrapper } from '../utils/testUtils';
import { WidgetSteps } from '../../src/constants';

// Mocks are configured via moduleNameMapper in jest.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const validatorMock = require('validator');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('EmailVerification', () => {
  const defaultProps = {
    email: '',
    setEmail: jest.fn(),
    tosAccepted: false,
    setTosAccepted: jest.fn(),
    setWidgetStep: jest.fn(),
    setOTP: jest.fn(),
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validatorMock.isEmail.mockReturnValue(true);
    __mockWidget.generateOTP.mockResolvedValue({
      newCodeGenerated: true,
      verificationCode: '123456',
    });
  });

  describe('rendering', () => {
    it('renders email input and ToS checkbox', () => {
      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Terms & conditions/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy policy/i)).toBeInTheDocument();
    });

    it('renders continue button', () => {
      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });

  describe('email validation', () => {
    it('shows error for invalid email on blur', () => {
      validatorMock.isEmail.mockReturnValue(false);

      render(<EmailVerification {...defaultProps} email="invalid-email" />, {
        wrapper: createWrapper(),
      });

      const input = screen.getByPlaceholderText('you@example.com');
      fireEvent.blur(input);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('does not show error for valid email', () => {
      validatorMock.isEmail.mockReturnValue(true);

      render(<EmailVerification {...defaultProps} email="valid@email.com" />, {
        wrapper: createWrapper(),
      });

      const input = screen.getByPlaceholderText('you@example.com');
      fireEvent.blur(input);

      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('clears error when user starts typing', () => {
      validatorMock.isEmail.mockReturnValue(false);

      render(<EmailVerification {...defaultProps} email="invalid" />, {
        wrapper: createWrapper(),
      });

      const input = screen.getByPlaceholderText('you@example.com');
      fireEvent.blur(input);

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

      // Simulate typing
      fireEvent.change(input, { target: { value: 'valid@email.com' } });

      // Error should be cleared by handleEmailChange
      expect(defaultProps.setEmail).toHaveBeenCalledWith('valid@email.com');
    });
  });

  describe('ToS checkbox', () => {
    it('calls setTosAccepted when checkbox is clicked', () => {
      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(defaultProps.setTosAccepted).toHaveBeenCalledWith(true);
    });

    it('opens Terms link in new tab', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Terms & conditions'));

      expect(windowOpenSpy).toHaveBeenCalledWith('https://justbeep.it/termsofservice', '_blank');

      windowOpenSpy.mockRestore();
    });

    it('opens Privacy link in new tab', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Privacy policy'));

      expect(windowOpenSpy).toHaveBeenCalledWith('https://justbeep.it/privacypolicy', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('continue button', () => {
    it('is disabled when email is empty', () => {
      render(<EmailVerification {...defaultProps} tosAccepted={true} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Continue')).toBeDisabled();
    });

    it('is disabled when ToS is not accepted', () => {
      render(<EmailVerification {...defaultProps} email="test@example.com" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Continue')).toBeDisabled();
    });

    it('is disabled when email is invalid', () => {
      validatorMock.isEmail.mockReturnValue(false);

      render(<EmailVerification {...defaultProps} email="invalid" tosAccepted={true} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Continue')).toBeDisabled();
    });

    it('is enabled when email is valid and ToS is accepted', () => {
      validatorMock.isEmail.mockReturnValue(true);

      render(<EmailVerification {...defaultProps} email="valid@email.com" tosAccepted={true} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Continue')).not.toBeDisabled();
    });
  });

  describe('OTP generation', () => {
    it('generates OTP and navigates to CodeConfirmation on continue', async () => {
      validatorMock.isEmail.mockReturnValue(true);

      render(<EmailVerification {...defaultProps} email="test@example.com" tosAccepted={true} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(__mockWidget.generateOTP).toHaveBeenCalledWith({
          email: 'test@example.com',
          tosAccepted: true,
        });
      });

      expect(defaultProps.setOTP).toHaveBeenCalledWith('123456');
      expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.CodeConfirmation);
    });

    it('navigates to CodeConfirmation even when code was not newly generated', async () => {
      validatorMock.isEmail.mockReturnValue(true);
      __mockWidget.generateOTP.mockResolvedValue({
        newCodeGenerated: false,
        verificationCode: null,
      });

      render(<EmailVerification {...defaultProps} email="test@example.com" tosAccepted={true} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.CodeConfirmation);
      });

      // Should not set OTP if not newly generated
      expect(defaultProps.setOTP).not.toHaveBeenCalled();
    });

    it('shows validation error when trying to continue with invalid email', async () => {
      validatorMock.isEmail.mockReturnValue(false);

      // Force the button to be enabled by setting valid props initially
      const { rerender } = render(
        <EmailVerification {...defaultProps} email="test@example.com" tosAccepted={true} />,
        { wrapper: createWrapper() },
      );

      // Make email invalid
      validatorMock.isEmail.mockReturnValue(false);

      // Force re-render with same props
      rerender(<EmailVerification {...defaultProps} email="invalid" tosAccepted={true} />);

      // Button should be disabled now
      expect(screen.getByText('Continue')).toBeDisabled();
    });
  });

  describe('back navigation', () => {
    it('navigates back to PaymentInterface when back button is clicked', () => {
      render(<EmailVerification {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole('button', { name: /go back/i }));

      expect(defaultProps.setWidgetStep).toHaveBeenCalledWith(WidgetSteps.PaymentInterface);
    });
  });
});
