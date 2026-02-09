import { renderHook, waitFor, act } from '@testing-library/react';
import { usePaymentStatus } from '../../src/hooks/usePaymentStatus';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockWidget } = require('@beep-it/sdk-core');

describe('usePaymentStatus', () => {
  const defaultProps = {
    referenceKey: 'test-ref-123',
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.getPaymentStatus.mockResolvedValue({
      paid: false,
      status: 'pending',
    });
  });

  describe('basic functionality', () => {
    it('fetches payment status when enabled', async () => {
      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(__mockWidget.getPaymentStatus).toHaveBeenCalledWith('test-ref-123');
      expect(result.current.data).toEqual({
        paid: false,
        status: 'pending',
      });
    });

    it('does not fetch when disabled', async () => {
      const { result } = renderHook(() => usePaymentStatus({ ...defaultProps, enabled: false }), {
        wrapper: createWrapper(),
      });

      // Give some time for any potential fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(__mockWidget.getPaymentStatus).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('does not fetch when referenceKey is null', async () => {
      const { result } = renderHook(
        () => usePaymentStatus({ ...defaultProps, referenceKey: null }),
        { wrapper: createWrapper() },
      );

      // Give some time for any potential fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(__mockWidget.getPaymentStatus).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('polling behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('polls every 15 seconds when status is processing', async () => {
      __mockWidget.getPaymentStatus.mockResolvedValue({
        paid: false,
        status: 'processing',
      });

      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = __mockWidget.getPaymentStatus.mock.calls.length;

      // Advance time by 15 seconds
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      // Should have made another call
      await waitFor(() => {
        expect(__mockWidget.getPaymentStatus.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('stops polling when paid is true', async () => {
      __mockWidget.getPaymentStatus.mockResolvedValue({
        paid: true,
        status: 'completed',
      });

      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountAfterInitial = __mockWidget.getPaymentStatus.mock.calls.length;

      // Advance time by 30 seconds (2 potential polls)
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have made additional calls
      expect(__mockWidget.getPaymentStatus.mock.calls.length).toBe(callCountAfterInitial);
    });

    it('stops polling when status is failed', async () => {
      __mockWidget.getPaymentStatus.mockResolvedValue({
        paid: false,
        status: 'failed',
      });

      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountAfterInitial = __mockWidget.getPaymentStatus.mock.calls.length;

      // Advance time
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have made additional calls
      expect(__mockWidget.getPaymentStatus.mock.calls.length).toBe(callCountAfterInitial);
    });

    it('stops polling when status is pending', async () => {
      __mockWidget.getPaymentStatus.mockResolvedValue({
        paid: false,
        status: 'pending',
      });

      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountAfterInitial = __mockWidget.getPaymentStatus.mock.calls.length;

      // Advance time
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have made additional calls (pending is terminal)
      expect(__mockWidget.getPaymentStatus.mock.calls.length).toBe(callCountAfterInitial);
    });
  });

  describe('query key', () => {
    it('includes referenceKey in query key', async () => {
      const wrapper = createWrapper();

      const { result: result1 } = renderHook(
        () => usePaymentStatus({ ...defaultProps, referenceKey: 'ref-1' }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const { result: result2 } = renderHook(
        () => usePaymentStatus({ ...defaultProps, referenceKey: 'ref-2' }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Each unique reference key should trigger a separate API call
      expect(__mockWidget.getPaymentStatus).toHaveBeenCalledWith('ref-1');
      expect(__mockWidget.getPaymentStatus).toHaveBeenCalledWith('ref-2');
    });
  });

  describe('error handling', () => {
    it('does not retry on error', async () => {
      __mockWidget.getPaymentStatus.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => usePaymentStatus(defaultProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // With retry: false, should only have been called once
      expect(__mockWidget.getPaymentStatus.mock.calls.length).toBe(1);
    });
  });
});
