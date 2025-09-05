import { InvoiceStatus } from './invoice';
import { SupportedToken } from './token';
export interface BeepPurchaseAsset {
  assetId: string;
  quantity: number;
}

/**
 * Parameters for requesting and purchasing assets via the BEEP payment system
 */

export interface RequestAndPurchaseAssetRequestParams {
  /** Array of assets (IDs, quantity) to request and purchase */
  assets: BeepPurchaseAsset[];
  /** Reference identifier for the payment transaction */
  paymentReference?: string;
  /** Generates a QR code if true. */
  generateQrCode?: boolean;
}

/**
 * Payload for creating a payment request
 * This interface represents the data needed to initiate a payment flow
 */
export interface RequestPaymentPayload {
  /** The amount to charge in decimal format (e.g., 10.50 for $10.50) */
  amount: number;
  /**
   * The token type to use for payment
   * @see {@link SupportedToken} for available options
   */
  token?: SupportedToken;
  /**
   * SPL token address for custom tokens (alternative to using the token enum)
   * @remarks Use either `token` or `splTokenAddress`, not both
   */
  splTokenAddress?: string;
  /** Human-readable description of what the payment is for */
  description: string;
  /**
   * Specifies who will be paying for this transaction
   * @default 'customer_wallet'
   */
  payerType?: 'customer_wallet' | 'merchant_wallet';
}

/**
 * Response data returned after successfully creating a payment request
 * Contains all the information needed for a customer to complete payment
 */
export interface PaymentRequestData {
  /** Unique identifier for the created invoice */
  invoiceId: string;
  /** Unique reference key for tracking this payment */
  referenceKey: string;
  /** URL where customers can complete the payment */
  paymentUrl: string;
  /** The payment amount in decimal format */
  amount: number;
  /** The SPL token address being used for this payment */
  splTokenAddress: string;
  /** When this payment request expires and becomes invalid */
  expiresAt: Date;
  /** ID of the merchant who will receive the payment */
  receivingMerchantId: string;
  /** Current status of the invoice */
  status: InvoiceStatus;
  /**
   * QR code data for mobile wallet scanning (optional)
   * @remarks Contains the same payment information as paymentUrl but in QR format
   */
  qrCode?: string;
}

export interface PaymentRequestPaidData {
  type: string;
  value: object[];
}

/**
 * Parameters required to create and sign a Solana transaction
 * Used for direct blockchain transaction processing
 */
export interface SignSolanaTransactionParams {
  /** Wallet address that will send the payment */
  senderAddress: string;
  /** Wallet address that will receive the payment */
  recipientAddress: string;
  /** The SPL token mint address for the token being transferred */
  tokenMintAddress: string;
  /** Amount to transfer in base units (not decimal) */
  amount: number;
  /** Number of decimal places for the token (e.g., USDT has 6 decimals) */
  decimals: number;
}

/**
 * Response data from signing a Solana transaction
 * Contains the signed transaction ready for broadcast to the network
 */
export interface SignSolanaTransactionData {
  /** Base64-encoded signed transaction ready for broadcast */
  signedTransaction: string;
  /** Proof of payment data for verification */
  proofOfPayment: string;
  /** Associated invoice ID for this transaction */
  invoiceId: string;
  /** Current status of the associated invoice */
  status: InvoiceStatus;
}
