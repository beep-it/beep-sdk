import { renderHook, waitFor } from '@testing-library/react';
import { useDynamicEnvironment } from '../../src/hooks/useDynamicEnvironment';
import { createWrapper } from '../utils/testUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mockWidget } = require('@beep-it/sdk-core');

describe('useDynamicEnvironment', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
    serverUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mockWidget.getDynamicEnv.mockResolvedValue({
      environmentId: 'test-env-id-123',
    });
  });

  describe('successful fetch', () => {
    it('fetches environment ID on mount', async () => {
      const { result } = renderHook(
        () => useDynamicEnvironment(defaultProps),
        { wrapper: createWrapper() }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe('test-env-id-123');
      expect(__mockWidget.getDynamicEnv).toHaveBeenCalledTimes(1);
    });

    it('returns environment ID from response', async () => {
      __mockWidget.getDynamicEnv.mockResolvedValue({
        environmentId: 'custom-env-id',
      });

      const { result } = renderHook(
        () => useDynamicEnvironment(defaultProps),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe('custom-env-id');
    });
  });

  describe('query caching', () => {
    it('uses Infinity staleTime for caching', async () => {
      const { result, rerender } = renderHook(
        () => useDynamicEnvironment(defaultProps),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstCallCount = __mockWidget.getDynamicEnv.mock.calls.length;

      // Rerender with same props
      rerender();

      // Should not make another API call due to caching
      expect(__mockWidget.getDynamicEnv.mock.calls.length).toBe(firstCallCount);
    });

    it('creates unique query key based on publishableKey and serverUrl', async () => {
      const wrapper = createWrapper();

      const { result: result1 } = renderHook(
        () => useDynamicEnvironment({ publishableKey: 'key1', serverUrl: 'url1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Different keys should make a new request
      const { result: result2 } = renderHook(
        () => useDynamicEnvironment({ publishableKey: 'key2', serverUrl: 'url2' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should have made 2 calls total (one for each unique key combination)
      expect(__mockWidget.getDynamicEnv).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('handles fetch error', async () => {
      const error = new Error('Network error');
      __mockWidget.getDynamicEnv.mockRejectedValue(error);

      const { result } = renderHook(
        () => useDynamicEnvironment(defaultProps),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      }, { timeout: 5000 });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('null response handling', () => {
    it('handles null environmentId in response', async () => {
      __mockWidget.getDynamicEnv.mockResolvedValue({
        environmentId: null,
      });

      const { result } = renderHook(
        () => useDynamicEnvironment(defaultProps),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });
});
