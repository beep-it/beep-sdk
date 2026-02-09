/**
 * Enumeration of SUI tokens supported by the BEEP payment platform
 * Each token represents a different cryptocurrency that can be used for payments
 */
export enum SupportedToken {
  USDC = 'USDC', // Coming soon
  /** Tether USD - A USD-pegged stablecoin */
  USDT = 'USDT',
}

/**
 * Mapping of supported token enums to their corresponding token addresses on SUI
 * These addresses are used for blockchain transactions and token identification
 */
export const TOKEN_ADDRESSES: Record<SupportedToken, string> = {
  [SupportedToken.USDC]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyB7u6T', // USDC token address
  [SupportedToken.USDT]: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT token address
};

/**
 * Decimal precision for each supported token
 * Used for converting between human-readable decimal amounts and blockchain base units
 * For example: 1.0 USDT = 1,000,000 base units (10^6)
 */
export const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  [SupportedToken.USDC]: 6, // USDC uses 6 decimal places
  [SupportedToken.USDT]: 6, // USDT uses 6 decimal places
};

/**
 * Utility class providing helper methods for token operations
 * Handles conversions between token enums and token addresses, decimal calculations, and validation
 */
export class TokenUtils {
  /**
   * Retrieves the token address for a supported token
   *
   * @param token - The supported token enum value
   * @returns The corresponding token address on SUI
   *
   * @example
   * ```typescript
   * const address = TokenUtils.getTokenAddress(SupportedToken.USDT);
   * console.log(address); // 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
   * ```
   */
  static getTokenAddress(token: SupportedToken): string {
    return TOKEN_ADDRESSES[token];
  }

  /**
   * Performs reverse lookup to find token enum from token address
   *
   * @param address - The token address to look up
   * @returns The corresponding SupportedToken enum value, or null if not found
   *
   * @example
   * ```typescript
   * const token = TokenUtils.getTokenFromAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
   * console.log(token); // SupportedToken.USDT
   * ```
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
   * Gets the number of decimal places for accurate token amount calculations
   *
   * @param token - The supported token to get decimals for
   * @returns Number of decimal places (e.g., 6 for USDC)
   *
   * @example
   * ```typescript
   * const decimals = TokenUtils.getTokenDecimals(SupportedToken.USDC);
   * const baseUnits = 1.5 * Math.pow(10, decimals); // Convert 1.5 USDC to base units
   * ```
   */
  static getTokenDecimals(token: SupportedToken): number {
    return TOKEN_DECIMALS[token] || 6;
  }

  /**
   * Type guard to check if a string value represents a supported token
   *
   * @param token - String value to check
   * @returns True if the token is supported, with proper type narrowing
   *
   * @example
   * ```typescript
   * const userInput = 'USDT';
   * if (TokenUtils.isTokenSupported(userInput)) {
   *   // userInput is now typed as SupportedToken
   *   const address = TokenUtils.getTokenAddress(userInput);
   * }
   * ```
   */
  static isTokenSupported(token: string): token is SupportedToken {
    return Object.values(SupportedToken).includes(token as SupportedToken);
  }

  /**
   * Returns the default token for operations when no token is specified
   *
   * @returns The default SupportedToken (currently USDT)
   *
   * @example
   * ```typescript
   * const defaultToken = TokenUtils.getDefaultToken();
   * console.log(defaultToken); // SupportedToken.USDC
   * ```
   */
  static getDefaultToken(): SupportedToken {
    return SupportedToken.USDC;
  }
}
