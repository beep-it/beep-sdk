import { renderHook } from '@testing-library/react';
import { useBeepPublicClient } from '../../src/hooks/useBeepPublicClient';
import { BeepPublicClient } from '@beep-it/sdk-core';

// The mock is auto-applied via jest.config.js moduleNameMapper

describe('useBeepPublicClient', () => {
  const defaultProps = {
    publishableKey: 'beep_pk_test_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('creates a BeepPublicClient with publishableKey', () => {
      const { result } = renderHook(() =>
        useBeepPublicClient({ publishableKey: 'beep_pk_test_key' })
      );

      expect(result.current).toBeDefined();
      expect(result.current).toBeInstanceOf(BeepPublicClient);
    });

    it('creates a BeepPublicClient with serverUrl', () => {
      const { result } = renderHook(() =>
        useBeepPublicClient({
          publishableKey: 'beep_pk_test_key',
          serverUrl: 'https://custom.api.com',
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current).toBeInstanceOf(BeepPublicClient);
    });

    it('provides access to widget module', () => {
      const { result } = renderHook(() =>
        useBeepPublicClient({ publishableKey: 'beep_pk_test_key' })
      );

      expect(result.current.widget).toBeDefined();
    });
  });

  describe('memoization', () => {
    it('returns the same client instance when props do not change', () => {
      const { result, rerender } = renderHook(
        (props) => useBeepPublicClient(props),
        { initialProps: defaultProps }
      );

      const firstClient = result.current;
      rerender(defaultProps);
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });

    it('returns a new client instance when publishableKey changes', () => {
      const { result, rerender } = renderHook(
        (props) => useBeepPublicClient(props),
        { initialProps: { publishableKey: 'beep_pk_key_1' } }
      );

      const firstClient = result.current;
      rerender({ publishableKey: 'beep_pk_key_2' });
      const secondClient = result.current;

      expect(firstClient).not.toBe(secondClient);
    });

    it('returns a new client instance when serverUrl changes', () => {
      const { result, rerender } = renderHook(
        (props) => useBeepPublicClient(props),
        { initialProps: { publishableKey: 'beep_pk_test', serverUrl: 'https://api1.com' } }
      );

      const firstClient = result.current;
      rerender({ publishableKey: 'beep_pk_test', serverUrl: 'https://api2.com' });
      const secondClient = result.current;

      expect(firstClient).not.toBe(secondClient);
    });

    it('returns same client when serverUrl changes from undefined to same undefined', () => {
      const { result, rerender } = renderHook(
        (props) => useBeepPublicClient(props),
        { initialProps: { publishableKey: 'beep_pk_test' } }
      );

      const firstClient = result.current;
      rerender({ publishableKey: 'beep_pk_test' });
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });
  });

  describe('widget access', () => {
    it('provides access to widget methods', () => {
      const { result } = renderHook(() =>
        useBeepPublicClient({ publishableKey: 'beep_pk_test_key' })
      );

      const widget = result.current.widget;
      expect(widget).toBeDefined();
      expect(typeof widget.createPaymentSession).toBe('function');
      expect(typeof widget.getPaymentStatus).toBe('function');
      expect(typeof widget.generateOTP).toBe('function');
      expect(typeof widget.verifyOTP).toBe('function');
      expect(typeof widget.generatePaymentQuote).toBe('function');
      expect(typeof widget.createCashPaymentOrder).toBe('function');
      expect(typeof widget.getDynamicEnv).toBe('function');
    });
  });
});
