/**
 * Supported SPL tokens on the BEEP platform
 */
export enum SupportedToken {
  USDC = 'USDC',
  USDT = 'USDT', // Will be supported in future
}

/**
 * Mapping of token types to their SPL addresses
 */
export const TOKEN_ADDRESSES: Record<SupportedToken, string> = {
  [SupportedToken.USDC]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T',
  [SupportedToken.USDT]: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 
};

/**
 * Decimal places for each supported token
 * Used for converting between decimal amounts and base units
 */
export const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  [SupportedToken.USDC]: 6, // USDC has 6 decimal places
  [SupportedToken.USDT]: 6, // USDT has 6 decimal places
};

/**
 * Helper class for token operations
 */
export class TokenUtils {
  /**
   * Get the SPL token address from a token enum
   */
  static getTokenAddress(token: SupportedToken): string {
    return TOKEN_ADDRESSES[token];
  }

  /**
   * Get token enum from SPL address
   */
  static getTokenFromAddress(address: string): SupportedToken | null {
    for (const [token, addr] of Object.entries(TOKEN_ADDRESSES)) {
      if (addr === address) {
        return token as SupportedToken;
      }
    }
    return null;
  }

  /**
   * Get the number of decimal places for a given token
   */
  static getTokenDecimals(token: SupportedToken): number {
    return TOKEN_DECIMALS[token] || 6; // Default to 6 if not found
  }

  /**
   * Check if a token is supported
   */
  static isTokenSupported(token: string): token is SupportedToken {
    return Object.values(SupportedToken).includes(token as SupportedToken);
  }

  /**
   * Get the default token (USDC)
   */
  static getDefaultToken(): SupportedToken {
    return SupportedToken.USDC;
  }
}
