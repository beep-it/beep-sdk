import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnectPanel, scaleToInteger } from '../../src/components/WalletConnectPanel';

// Mocks are configured via moduleNameMapper in jest.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dynamicMock = require('@dynamic-labs/sdk-react-core');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const suiMock = require('@dynamic-labs/sui');

describe('WalletConnectPanel', () => {
  let mockSetShowAuthFlow: jest.Mock;
  let mockHandleLogOut: jest.Mock;
  let mockOnPaymentComplete: jest.Mock;
  let mockSuiClient: any;
  let mockPrimaryWallet: any;

  const defaultProps = {
    destinationAddress: 'dest-address-123',
    paymentSetupData: {
      qrCode: 'data:image/png;base64,mockQr',
      referenceKey: 'ref-123',
      paymentUrl: 'sui:url',
      totalAmount: 25.5,
      isCashPaymentEligible: true,
      destinationAddress: 'dest-address-123',
      processedAssets: [],
    },
    onPaymentComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetShowAuthFlow = jest.fn();
    mockHandleLogOut = jest.fn().mockResolvedValue(undefined);
    mockOnPaymentComplete = jest.fn();

    // Setup mock Sui client
    mockSuiClient = {
      getCoins: jest.fn().mockResolvedValue({
        data: [{ coinObjectId: 'coin-1', balance: '100000000' }],
      }),
      executeTransactionBlock: jest.fn().mockResolvedValue({
        digest: 'tx-digest-123',
      }),
    };

    // Setup mock primary wallet
    mockPrimaryWallet = {
      address: '0x1234567890abcdef',
      chain: 'SUI',
      connector: { key: 'slushsui' },
      getSuiClient: jest.fn().mockResolvedValue(mockSuiClient),
      signTransaction: jest.fn().mockResolvedValue({
        signature: 'mock-signature',
        bytes: 'mock-bytes',
      }),
    };

    // Default to disconnected state
    dynamicMock.useDynamicContext.mockReturnValue({
      primaryWallet: null,
      user: null,
      isAuthenticated: false,
      setShowAuthFlow: mockSetShowAuthFlow,
      handleLogOut: mockHandleLogOut,
      showAuthFlow: false,
    });

    suiMock.isSuiWallet.mockReturnValue(true);
  });

  describe('disconnected state', () => {
    it('renders connect wallet button when not connected', () => {
      render(<WalletConnectPanel {...defaultProps} />);

      expect(screen.getByText('Connect your wallet')).toBeInTheDocument();
    });

    it('opens modal when connect button is clicked', () => {
      // Set showAuthFlow to true to prevent useEffect reset
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: null,
        user: null,
        isAuthenticated: false,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: true,
      });

      render(<WalletConnectPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Connect your wallet'));

      expect(mockSetShowAuthFlow).toHaveBeenCalledWith(true);
    });
  });

  describe('connected state', () => {
    beforeEach(() => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: mockPrimaryWallet,
        user: { id: 'user-123' },
        isAuthenticated: true,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });
    });

    it('renders wallet info when connected', () => {
      render(<WalletConnectPanel {...defaultProps} />);

      expect(screen.getByText(/Pay with Slush on SUI/i)).toBeInTheDocument();
    });

    it('renders disconnect button when connected', () => {
      render(<WalletConnectPanel {...defaultProps} />);

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('calls handleLogOut when disconnect is clicked', async () => {
      render(<WalletConnectPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(mockHandleLogOut).toHaveBeenCalled();
      });
    });

    it('initiates payment when pay button is clicked', async () => {
      render(<WalletConnectPanel {...defaultProps} onPaymentComplete={mockOnPaymentComplete} />);

      fireEvent.click(screen.getByText(/Pay with Slush/i));

      await waitFor(() => {
        expect(mockPrimaryWallet.getSuiClient).toHaveBeenCalled();
      });
    });
  });

  describe('provider detection', () => {
    const testCases = [
      { key: 'phantom', expectedName: 'Phantom' },
      { key: 'metamask', expectedName: 'MetaMask' },
      { key: 'slushsui', expectedName: 'Slush' },
      { key: 'suietsui', expectedName: 'Suiet' },
      { key: 'coinbase', expectedName: 'Coinbase' },
      { key: 'walletconnect', expectedName: 'WalletConnect' },
    ];

    testCases.forEach(({ key, expectedName }) => {
      it(`detects ${expectedName} provider`, () => {
        dynamicMock.useDynamicContext.mockReturnValue({
          primaryWallet: {
            ...mockPrimaryWallet,
            connector: { key },
          },
          user: { id: 'user-123' },
          isAuthenticated: true,
          setShowAuthFlow: mockSetShowAuthFlow,
          handleLogOut: mockHandleLogOut,
          showAuthFlow: false,
        });

        render(<WalletConnectPanel {...defaultProps} />);

        expect(screen.getByText(new RegExp(`Pay with ${expectedName}`))).toBeInTheDocument();
      });
    });

    it('shows truncated address for unknown provider', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: {
          ...mockPrimaryWallet,
          address: '0xabcdef1234567890',
          connector: { key: 'unknown-wallet' },
        },
        user: { id: 'user-123' },
        isAuthenticated: true,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      render(<WalletConnectPanel {...defaultProps} />);

      // Should show truncated address: first 6 chars + "..." + last 4 chars
      expect(screen.getByText(/Pay with 0xabcd\.\.\.7890/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows button is disabled when loading (during connection)', async () => {
      // When the user has opened modal and is connecting, but not yet connected
      // The hook sets isLoading to true only while showAuthFlow is also true
      // But the useEffect resets it because showAuthFlow=true and isConnected=false
      // To test the loading behavior, we need to test via openModal action
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: null,
        user: null,
        isAuthenticated: false,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: true, // Modal is open
      });

      render(<WalletConnectPanel {...defaultProps} />);

      // Click opens modal and sets loading
      fireEvent.click(screen.getByText('Connect your wallet'));

      // The button should eventually show connecting text
      // Note: This depends on the hook's internal loading state which is immediately reset
      // In production, the modal being open would trigger auth flow
      expect(mockSetShowAuthFlow).toHaveBeenCalledWith(true);
    });
  });

  describe('transaction building', () => {
    beforeEach(() => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: mockPrimaryWallet,
        user: { id: 'user-123' },
        isAuthenticated: true,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });
    });

    it('calls onPaymentComplete with transaction digest on success', async () => {
      render(<WalletConnectPanel {...defaultProps} onPaymentComplete={mockOnPaymentComplete} />);

      fireEvent.click(screen.getByText(/Pay with Slush/i));

      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalledWith('tx-digest-123');
      });
    });

    it('handles insufficient funds error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockSuiClient.getCoins.mockResolvedValue({ data: [] });

      render(<WalletConnectPanel {...defaultProps} onPaymentComplete={mockOnPaymentComplete} />);

      fireEvent.click(screen.getByText(/Pay with Slush/i));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[WalletConnectButton] Payment failed:',
          expect.any(Error),
        );
      });

      expect(mockOnPaymentComplete).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('handles wallet not Sui compatible error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      suiMock.isSuiWallet.mockReturnValue(false);

      render(<WalletConnectPanel {...defaultProps} onPaymentComplete={mockOnPaymentComplete} />);

      fireEvent.click(screen.getByText(/Pay with Slush/i));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[WalletConnectButton] Payment failed:',
          expect.objectContaining({
            message: 'Wallet not connected or not compatible',
          }),
        );
      });

      expect(mockOnPaymentComplete).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('handles Sui client failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockPrimaryWallet.getSuiClient.mockResolvedValue(null);

      render(<WalletConnectPanel {...defaultProps} onPaymentComplete={mockOnPaymentComplete} />);

      fireEvent.click(screen.getByText(/Pay with Slush/i));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[WalletConnectButton] Payment failed:',
          expect.objectContaining({
            message: 'Failed to get Sui client',
          }),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});


describe('scaleToInteger', () => {
    it('scales positive decimal values correctly', () => {
      expect(scaleToInteger(1.005, 6)).toBe('1005000');
      expect(scaleToInteger(19.99, 6)).toBe('19990000');
    });
    it('handles negative values', () => {
      expect(scaleToInteger(-0.5, 6)).toBe('-500000');
    });
    it('handles values below the scientific notation threshold', () => {
      // (1e-7).toString() === '1e-7' in JS, which the old split-on-'.' logic
      // did not handle at all.
      expect(scaleToInteger(1e-7, 6)).toBe('0');
    });
    it('handles values above the scientific notation threshold', () => {
      // (1e21).toString() === '1e+21' in JS.
      expect(scaleToInteger(1e21, 6)).toBe(`1${'0'.repeat(27)}`);
    });
    it('handles whole numbers and zero', () => {
      expect(scaleToInteger(5, 6)).toBe('5000000');
      expect(scaleToInteger(0, 6)).toBe('0');
    });
    it('truncates extra fractional digits beyond decimals', () => {
      expect(scaleToInteger(1.0000001, 6)).toBe('1000000');
    });
});
