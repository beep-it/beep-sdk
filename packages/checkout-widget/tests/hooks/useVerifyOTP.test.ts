import { renderHook, waitFor, act } from '@testing-library/react';
import { useVerifyOTP } from '../../src/hooks/useVerifyOTP';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('useVerifyOTP', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.verifyOTP.mockResolvedValue({
      success: true,
    });
  });

  describe('mutation success', () => {
    it('verifies OTP successfully', async () => {
      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      expect(result.current.isPending).toBe(false);

      let response: any;
      await act(async () => {
        response = await result.current.verifyOTP({
          email: 'test@example.com',
          otp: '123456',
        });
      });

      expect(response).toEqual({ success: true });
      expect(__mockWidget.verifyOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
      });
    });

    it('handles successful verification', async () => {
      __mockWidget.verifyOTP.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      let response: any;
      await act(async () => {
        response = await result.current.verifyOTP({
          email: 'test@example.com',
          otp: '123456',
        });
      });

      expect(response.success).toBe(true);
    });

    it('handles failed verification (invalid OTP)', async () => {
      __mockWidget.verifyOTP.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      let response: any;
      await act(async () => {
        response = await result.current.verifyOTP({
          email: 'test@example.com',
          otp: '000000',
        });
      });

      expect(response.success).toBe(false);
    });
  });

  describe('mutation error', () => {
    it('rejects on error', async () => {
      const error = new Error('Verification failed');
      __mockWidget.verifyOTP.mockRejectedValue(error);

      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      await expect(
        act(async () => {
          await result.current.verifyOTP({
            email: 'test@example.com',
            otp: '123456',
          });
        }),
      ).rejects.toThrow('Verification failed');
    });

    it('sets error state on failure', async () => {
      const error = new Error('API Error');
      __mockWidget.verifyOTP.mockRejectedValue(error);

      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      try {
        await act(async () => {
          await result.current.verifyOTP({
            email: 'test@example.com',
            otp: '123456',
          });
        });
      } catch (_e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('input parameters', () => {
    it('passes email and otp to API', async () => {
      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.verifyOTP({
          email: 'user@domain.com',
          otp: '654321',
        });
      });

      expect(__mockWidget.verifyOTP).toHaveBeenCalledWith({
        email: 'user@domain.com',
        otp: '654321',
      });
    });

    it('handles 6-digit OTP string', async () => {
      const { result } = renderHook(() => useVerifyOTP(defaultProps), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.verifyOTP({
          email: 'test@example.com',
          otp: '000001',
        });
      });

      expect(__mockWidget.verifyOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '000001',
      });
    });
  });
});
