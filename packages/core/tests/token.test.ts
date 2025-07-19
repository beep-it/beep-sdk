import { TokenUtils, SupportedToken } from '../src';

describe('TokenUtils', () => {
  it('getTokenAddress returns correct address for USDT', () => {
    const address = TokenUtils.getTokenAddress(SupportedToken.USDT);
    expect(address).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
  });

  it('isTokenSupported returns true for supported tokens', () => {
    expect(TokenUtils.isTokenSupported(SupportedToken.USDT)).toBe(true);
  });

  it('isTokenSupported returns false for unsupported tokens', () => {
    expect(TokenUtils.isTokenSupported('NOT_REAL_TOKEN' as SupportedToken)).toBe(false);
  });

  it('getTokenFromAddress returns correct token for address', () => {
    const token = TokenUtils.getTokenFromAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
    expect(token).toBe(SupportedToken.USDT);
  });

  it('getTokenFromAddress returns null for unknown address', () => {
    const token = TokenUtils.getTokenFromAddress('invalid_address');
    expect(token).toBeNull();
  });

  it('getDefaultToken returns USDT', () => {
    expect(TokenUtils.getDefaultToken()).toBe(SupportedToken.USDT);
  });
});
