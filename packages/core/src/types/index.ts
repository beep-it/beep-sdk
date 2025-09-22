// Re-export all type definitions for convenient importing
export * from './invoice';
export * from './payment';
export * from './product';
export * from './token';

import { PaymentRequestData, SignSolanaTransactionData } from './payment';
/**
 * Standard response wrapper for BEEP API endpoints
 * All API responses follow this structure
 */
export interface BeepResponse {
  /** Response payload data */
  data: unknown;
  /** HTTP status code */
  status: number;
}

/**
 * Typed response for payment request endpoints
 * Extends the base response with specific payment request data
 */
export interface RequestAndPurchaseAssetResponse extends BeepResponse {
  /** Payment request data containing invoice details and payment URLs */
  data: PaymentRequestData;
}

/**
 * Typed response for Solana transaction signing endpoints
 * Contains the signed transaction ready for broadcast
 */
export interface SignSolanaTransactionResponse extends BeepResponse {
  /** Signed transaction data and associated invoice information */
  data: SignSolanaTransactionData;
}
