import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletAddressLabel } from '../../src/components/WalletAddressLabel';

describe('WalletAddressLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // navigator.clipboard is mocked in setup.ts
  });

  describe('address truncation', () => {
    it('truncates long addresses correctly', () => {
      const longAddress = '0x1234567890abcdef1234567890abcdef12345678';
      render(<WalletAddressLabel walletAddress={longAddress} />);

      // First 12 chars + ... + last 4 chars
      expect(screen.getByText('0x1234567890...5678')).toBeInTheDocument();
    });

    it('shows full address if short enough', () => {
      const shortAddress = '0x123456789012';
      render(<WalletAddressLabel walletAddress={shortAddress} />);

      expect(screen.getByText('0x123456789012')).toBeInTheDocument();
    });

    it('handles undefined address', () => {
      render(<WalletAddressLabel walletAddress={undefined} />);

      expect(screen.getByText('Invalid address')).toBeInTheDocument();
    });

    it('handles empty address', () => {
      render(<WalletAddressLabel walletAddress="" />);

      expect(screen.getByText('Invalid address')).toBeInTheDocument();
    });
  });

  describe('copy to clipboard', () => {
    it('copies address to clipboard when copy button is clicked', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      render(<WalletAddressLabel walletAddress={address} />);

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(address);
      });
    });

    it('shows copied feedback after copying', async () => {
      jest.useFakeTimers();
      const address = '0x1234567890abcdef';
      render(<WalletAddressLabel walletAddress={address} />);

      const copyButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();

      // Feedback disappears after 2 seconds
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument();

      jest.useRealTimers();
    });

    it('does not copy when address is undefined', async () => {
      render(<WalletAddressLabel walletAddress={undefined} />);

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('handles clipboard API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      const address = '0x1234567890abcdef';
      render(<WalletAddressLabel walletAddress={address} />);

      const copyButton = screen.getByRole('button');
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy: ', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('copy button state', () => {
    it('copy button is disabled when address is undefined', () => {
      render(<WalletAddressLabel walletAddress={undefined} />);

      const copyButton = screen.getByRole('button');
      expect(copyButton).toBeDisabled();
    });

    it('copy button is enabled when address is provided', () => {
      render(<WalletAddressLabel walletAddress="0x123" />);

      const copyButton = screen.getByRole('button');
      expect(copyButton).not.toBeDisabled();
    });
  });

  describe('rendering', () => {
    it('renders the copy icon', () => {
      render(<WalletAddressLabel walletAddress="0x123" />);

      // SVG icon should be present
      const copyButton = screen.getByRole('button');
      expect(copyButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
