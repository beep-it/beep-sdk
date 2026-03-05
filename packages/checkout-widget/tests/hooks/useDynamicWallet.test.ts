import { renderHook, act } from '@testing-library/react';
import { useDynamicWallet } from '../../src/hooks/useDynamicWallet';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dynamicMock = require('@dynamic-labs/sdk-react-core');

describe('useDynamicWallet', () => {
  let mockSetShowAuthFlow: jest.Mock;
  let mockHandleLogOut: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetShowAuthFlow = jest.fn();
    mockHandleLogOut = jest.fn().mockResolvedValue(undefined);

    // Reset to default disconnected state
    dynamicMock.useDynamicContext.mockReturnValue({
      primaryWallet: null,
      user: null,
      isAuthenticated: false,
      setShowAuthFlow: mockSetShowAuthFlow,
      handleLogOut: mockHandleLogOut,
      showAuthFlow: false,
    });
  });

  describe('initial state', () => {
    it('returns disconnected state when no wallet', () => {
      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.walletAddress).toBeNull();
      expect(result.current.primaryWallet).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns connected state when wallet and user are present', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0x1234567890abcdef' },
        user: { id: 'user-123' },
        isAuthenticated: true,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.walletAddress).toBe('0x1234567890abcdef');
      expect(result.current.primaryWallet).toEqual({ address: '0x1234567890abcdef' });
    });
  });

  describe('openModal', () => {
    it('calls setShowAuthFlow(true)', () => {
      // Set showAuthFlow to true to prevent the useEffect from immediately resetting isLoading
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: null,
        user: null,
        isAuthenticated: false,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: true, // Simulate modal being shown
      });

      const { result } = renderHook(() => useDynamicWallet());

      act(() => {
        result.current.openModal();
      });

      expect(mockSetShowAuthFlow).toHaveBeenCalledWith(true);
      // isLoading is true while showAuthFlow is true and not connected
      expect(result.current.isLoading).toBe(true);
    });

    it('does nothing if setShowAuthFlow is not available', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: null,
        user: null,
        setShowAuthFlow: undefined,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      act(() => {
        result.current.openModal();
      });

      // Should not throw and loading should still be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('calls handleLogOut and manages loading state', async () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0x123' },
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockHandleLogOut).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('does nothing if handleLogOut is not available', async () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0x123' },
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: undefined,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      await act(async () => {
        await result.current.disconnect();
      });

      // Should not throw
      expect(result.current.isLoading).toBe(false);
    });

    it('handles logout errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorMockLogOut = jest.fn().mockRejectedValue(new Error('Logout failed'));

      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0x123' },
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: errorMockLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      await act(async () => {
        await result.current.disconnect();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useDynamicWallet] Error disconnecting wallet:',
        expect.any(Error),
      );
      expect(result.current.isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('context null-safety', () => {
    it('handles null context gracefully', () => {
      dynamicMock.useDynamicContext.mockReturnValue(null);

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.walletAddress).toBeNull();
      expect(result.current.isLoading).toBe(false);

      // openModal should not throw
      act(() => {
        result.current.openModal();
      });
    });

    it('handles undefined context values', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: undefined,
        user: undefined,
        setShowAuthFlow: undefined,
        handleLogOut: undefined,
        showAuthFlow: undefined,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.walletAddress).toBeNull();
    });
  });

  describe('isConnected logic', () => {
    it('is false when primaryWallet is present but user is missing', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0x123' },
        user: null,
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
    });

    it('is false when user is present but primaryWallet is missing', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: null,
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
    });

    it('is false when wallet has no address', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: null },
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(false);
    });

    it('is true only when all conditions are met', () => {
      dynamicMock.useDynamicContext.mockReturnValue({
        primaryWallet: { address: '0xabc123' },
        user: { id: 'user-1' },
        setShowAuthFlow: mockSetShowAuthFlow,
        handleLogOut: mockHandleLogOut,
        showAuthFlow: false,
      });

      const { result } = renderHook(() => useDynamicWallet());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.walletAddress).toBe('0xabc123');
    });
  });
});
