import { SupportedToken } from '../src/types';
import { TokenUtils } from '../src/types/token';

describe('TokenUtils', () => {
  it('getTokenAddress returns correct address for USDC', () => {
    const address = TokenUtils.getTokenAddress(SupportedToken.USDC);
    expect(address).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T');
  });

  it('isTokenSupported returns true for supported tokens', () => {
    expect(TokenUtils.isTokenSupported(SupportedToken.USDC)).toBe(true);
  });

  it('isTokenSupported returns false for unsupported tokens', () => {
    expect(TokenUtils.isTokenSupported('NOT_REAL_TOKEN' as SupportedToken)).toBe(false);
  });

  it('getTokenFromAddress returns correct token for address', () => {
    const token = TokenUtils.getTokenFromAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T');
    expect(token).toBe(SupportedToken.USDC);
  });

  it('getTokenFromAddress returns null for unknown address', () => {
    const token = TokenUtils.getTokenFromAddress('invalid_address');
    expect(token).toBeNull();
  });

  it('getDefaultToken returns USDC', () => {
    expect(TokenUtils.getDefaultToken()).toBe(SupportedToken.USDC);
  });
});
