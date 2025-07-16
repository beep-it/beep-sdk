import { TokenUtils, SupportedToken } from '../src';

describe('TokenUtils', () => {
  test('getTokenAddress returns correct address for USDC', () => {
    const address = TokenUtils.getTokenAddress(SupportedToken.USDC);
    expect(address).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T');
  });

  test('isTokenSupported returns true for supported tokens', () => {
    expect(TokenUtils.isTokenSupported(SupportedToken.USDC)).toBe(true);
  });

  test('isTokenSupported returns false for unsupported tokens', () => {
    expect(TokenUtils.isTokenSupported('NOT_REAL_TOKEN' as SupportedToken)).toBe(false);
  });

  test('getTokenFromAddress returns correct token for address', () => {
    const token = TokenUtils.getTokenFromAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T');
    expect(token).toBe(SupportedToken.USDC);
  });

  test('getTokenFromAddress returns null for unknown address', () => {
    const token = TokenUtils.getTokenFromAddress('invalid_address');
    expect(token).toBeNull();
  });

  test('getDefaultToken returns USDC', () => {
    expect(TokenUtils.getDefaultToken()).toBe(SupportedToken.USDC);
  });
});
