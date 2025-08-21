import { InvoiceStatus } from './invoice';
import { SupportedToken } from './token';

export interface RequestAndPurchaseAssetRequestParams {
  /** Array of asset IDs to request and purchase */
  assetIds?: string[];
  /** Reference identifier for the payment transaction */
  paymentReference?: string;
}

/**
 * Asset chunk interface for streaming payments
 */
export interface AssetChunk {
  /** The ID of the asset being streamed */
  assetId: string;
  /** The quantity of the asset chunk */
  quantity: number;
}

/**
 * Payload for issuing a payment request
 */
export interface IssuePaymentPayload {
  /** API key for authentication */
  apiKey: string;
  /** Asset chunks to purchase */
  assetChunks: AssetChunk[];
  /** The paying merchant ID */
  payingMerchantId: string;
  /** The existing invoice id (optional) */
  invoiceId?: string;
}

/**
 * Response from issuing a payment
 */
export interface IssuePaymentResponse {
  /** Reference key for the generated streaming payment */
  referenceKey: string;
  /** Invoice ID for the generated streaming payment */
  invoiceId: string;
}

/**
 * Payload for starting a streaming session
 */
export interface StartStreamingPayload {
  /** API key for authentication */
  apiKey: string;
  /** ID of the invoice to start streaming for */
  invoiceId: string;
}

/**
 * Response from starting a streaming session
 */
export interface StartStreamingResponse {
  /** The UUID of the streaming invoice */
  invoiceId: string;
}

/**
 * Payload for pausing streaming
 */
export interface PauseStreamingPayload {
  /** API key for authentication */
  apiKey: string;
  /** ID of the invoice to pause streaming for */
  invoiceId: string;
}

/**
 * Response from pausing streaming
 */
export interface PauseStreamingResponse {
  /** Whether the streaming was successfully paused */
  success: boolean;
}

/**
 * Payload for stopping streaming
 */
export interface StopStreamingPayload {
  /** API key for authentication */
  apiKey: string;
  /** ID of the invoice to stop streaming for */
  invoiceId: string;
}

/**
 * Response from stopping streaming
 */
export interface StopStreamingResponse {
  /** The ID of the invoice that was stopped */
  invoiceId: string;
  /** List of reference keys associated with the streaming payments */
  referenceKeys: string[];
}

/**
 * Payload for requesting a payment
 */
export interface RequestPaymentPayload {
  amount: number;
  token?: SupportedToken; // The token type (USDT, etc.)
  splTokenAddress?: string; // Optional: The SPL token address (alternative to token)
  description: string;
  payerType?: 'customer_wallet' | 'merchant_wallet'; // Added payerType field to match API requirements
}

/**
 * Response type for payment request endpoints
 */
export interface PaymentRequestData {
  invoiceId: string;
  referenceKey: string;
  paymentUrl: string;
  amount: number;
  splTokenAddress: string;
  expiresAt: Date;
  receivingMerchantId: string;
  status: InvoiceStatus;
  qrCode?: string;
}

export interface SignSolanaTransactionParams {
  senderAddress: string;
  recipientAddress: string;
  tokenMintAddress: string;
  amount: number;
  decimals: number;
}
export interface SignSolanaTransactionData {
  signedTransaction: string;
  proofOfPayment: string;
  invoiceId: string;
  status: InvoiceStatus;
}

/**
 * Request interface for requesting and purchasing assets
 */
