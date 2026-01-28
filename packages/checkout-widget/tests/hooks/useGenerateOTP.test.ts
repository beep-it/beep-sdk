import { renderHook, waitFor, act } from '@testing-library/react';
import { useGenerateOTP } from '../../src/hooks/useGenerateOTP';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mockWidget } = require('@beep-it/sdk-core');

describe('useGenerateOTP', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.generateOTP.mockResolvedValue({
      verificationCode: '123456',
      newCodeGenerated: true,
    });
  });

  describe('mutation success', () => {
    it('generates OTP successfully', async () => {
      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      expect(result.current.isPending).toBe(false);

      let response: any;
      await act(async () => {
        response = await result.current.generateOTP({
          email: 'test@example.com',
          tosAccepted: true,
        });
      });

      expect(response).toEqual({
        verificationCode: '123456',
        newCodeGenerated: true,
      });
      expect(__mockWidget.generateOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        tosAccepted: true,
      });
    });

    it('handles newCodeGenerated: false response', async () => {
      __mockWidget.generateOTP.mockResolvedValue({
        verificationCode: undefined,
        newCodeGenerated: false,
      });

      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      let response: any;
      await act(async () => {
        response = await result.current.generateOTP({
          email: 'test@example.com',
          tosAccepted: true,
        });
      });

      expect(response.newCodeGenerated).toBe(false);
      expect(response.verificationCode).toBeUndefined();
    });
  });

  describe('mutation error', () => {
    it('rejects on error', async () => {
      const error = new Error('Failed to generate OTP');
      __mockWidget.generateOTP.mockRejectedValue(error);

      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      await expect(
        act(async () => {
          await result.current.generateOTP({
            email: 'test@example.com',
            tosAccepted: true,
          });
        })
      ).rejects.toThrow('Failed to generate OTP');
    });

    it('sets error state on failure', async () => {
      const error = new Error('API Error');
      __mockWidget.generateOTP.mockRejectedValue(error);

      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      try {
        await act(async () => {
          await result.current.generateOTP({
            email: 'test@example.com',
            tosAccepted: true,
          });
        });
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('input validation', () => {
    it('passes email and tosAccepted to API', async () => {
      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.generateOTP({
          email: 'user@domain.com',
          tosAccepted: true,
        });
      });

      expect(__mockWidget.generateOTP).toHaveBeenCalledWith({
        email: 'user@domain.com',
        tosAccepted: true,
      });
    });

    it('can be called with tosAccepted: false', async () => {
      const { result } = renderHook(
        () => useGenerateOTP(defaultProps),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.generateOTP({
          email: 'user@domain.com',
          tosAccepted: false,
        });
      });

      expect(__mockWidget.generateOTP).toHaveBeenCalledWith({
        email: 'user@domain.com',
        tosAccepted: false,
      });
    });
  });
});
