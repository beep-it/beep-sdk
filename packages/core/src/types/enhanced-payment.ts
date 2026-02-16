/**
 * @fileoverview Enhanced payment types with comprehensive documentation and type safety
 */

import { UUID, MoneyAmount, ISODateTime, TransactionSignature, WalletAddress } from './common';
import { InvoiceStatus } from './invoice';
import { SupportedToken } from './token';

/**
 * Asset reference for purchasing existing products
 * @example
 * ```typescript
 * const asset: BeepPurchaseAsset = {
 *   assetId: '123e4567-e89b-12d3-a456-426614174000',
 *   quantity: 2,
 *   name: 'Premium Coffee', // Optional override
 * };
 * ```
 */
export interface BeepPurchaseAsset {
  /** UUID of the existing product to purchase */
  assetId: UUID;
  /** Number of units to purchase (must be positive integer) */
  quantity: number;
  /** Optional name override for display purposes */
  name?: string;
  /** Optional description override for display purposes */
  description?: string;
}

/**
 * Parameters for requesting and purchasing assets
 * @description Supports the 402 Payment Required flow for agent-compatible payments
 * @example
 * ```typescript
 * // Initial request (no payment reference)
 * const request: RequestAndPurchaseAssetParams = {
 *   assets: [{ assetId: 'product-uuid', quantity: 1 }],
 *   generateQrCode: true,
 *   paymentLabel: 'My Store',
 * };
 *
 * // Polling request (with payment reference)
 * const pollRequest: RequestAndPurchaseAssetParams = {
 *   assets: [{ assetId: 'product-uuid', quantity: 1 }],
 *   paymentReference: response.referenceKey,
 * };
 * ```
 */
export interface RequestAndPurchaseAssetParams {
  /** Array of assets to purchase */
  assets: BeepPurchaseAsset[];

  /**
   * Payment reference from initial 402 response
   * @description Include this when polling for payment completion
   */
  paymentReference?: string;

  /**
   * Generate QR code for mobile wallet payments
   * @default true
   */
  generateQrCode?: boolean;

  /**
   * Label displayed in payment wallets
   * @example "Coffee Shop - Downtown"
   * @maxLength 50
   */
  paymentLabel?: string;
}

/**
 * Payment request creation parameters
 * @example
 * ```typescript
 * const payment: RequestPaymentPayload = {
 *   amount: 25.50,
 *   token: SupportedToken.USDC,
 *   description: 'Premium subscription - 1 month',
 *   metadata: {
 *     userId: 'user-123',
 *     plan: 'premium',
 *   }
 * };
 * ```
 */
export interface RequestPaymentPayload {
  /**
   * Amount to charge in decimal format
   * @min 0.01
   * @example 10.50
   */
  amount: number;

  /**
   * Token type for payment
   * @description Use either `token` or `splTokenAddress`, not both
   */
  token?: SupportedToken;

  /**
   * Custom token address
   * @description Alternative to using the token enum
   * @pattern ^[1-9A-HJ-NP-Za-km-z]{32,44}$
   */
  splTokenAddress?: string;

  /**
   * Human-readable payment description
   * @maxLength 200
   */
  description?: string;

  /**
   * Custom metadata for your records
   * @description This data is returned in webhooks and payment queries
   */
  metadata?: Record<string, unknown>;

  /**
   * Webhook URL for payment notifications
   * @format uri
   * @example "https://api.example.com/webhooks/beep"
   */
  webhookUrl?: string;

  /**
   * Payment expiration time in minutes
   * @default 15
   * @min 5
   * @max 1440
   */
  expirationMinutes?: number;
}

/**
 * Payment request data structure (402 response)
 * @description Returned when payment is required (HTTP 402)
 */
export interface PaymentRequestData {
  /** Unique reference key for this payment request */
  referenceKey: string;

  /**
   * Deep link URL for payment
   * @format uri
   * @example "sui:pay?recipient=..."
   */
  paymentUrl: string;

  /**
   * Base64-encoded QR code image
   * @description Only present if generateQrCode was true
   * @contentEncoding base64
   * @contentMediaType image/png
   */
  qrCode?: string;

  /** Total amount to be paid */
  amount: MoneyAmount;

  /** Token used for payment */
  token: SupportedToken;

  /** Recipient wallet address */
  recipientAddress: WalletAddress;

  /** Payment expiration timestamp */
  expiresAt: ISODateTime;

  /** Current payment status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
}

/**
 * Successful payment response
 * @description Returned when payment is completed successfully
 */
export interface PaymentSuccessResponse {
  /** Payment receipt information */
  receipt: {
    /** Transaction ID on the blockchain */
    transactionId: TransactionSignature;
    /** Amount paid */
    amount: MoneyAmount;
    /** Token used */
    token: SupportedToken;
    /** Payment timestamp */
    timestamp: ISODateTime;
    /** Payer wallet address */
    payerAddress: WalletAddress;
    /** Recipient wallet address */
    recipientAddress: WalletAddress;
  };

  /** Blockchain transaction signature */
  txSignature: TransactionSignature;

  /** Invoice ID if payment was for an invoice */
  invoiceId?: UUID;

  /** Custom metadata passed during payment creation */
  metadata?: Record<string, unknown>;
}

/**
 * Combined response type for request and purchase asset endpoint
 * @description Can be either a payment request (402) or success response (200)
 */
export type RequestAndPurchaseAssetResponse = PaymentRequestData | PaymentSuccessResponse;

/**
 * Type guard to check if response is a payment request (402)
 * @example
 * ```typescript
 * const response = await beep.payments.requestAndPurchaseAsset(params);
 * if (isPaymentRequest(response)) {
 *   // Show QR code to user
 *   displayQR(response.qrCode);
 * } else {
 *   // Payment completed
 *   console.log('Transaction:', response.txSignature);
 * }
 * ```
 */
export function isPaymentRequest(
  response: RequestAndPurchaseAssetResponse,
): response is PaymentRequestData {
  return 'referenceKey' in response && 'paymentUrl' in response;
}

/**
 * Type guard to check if response is a payment success
 */
export function isPaymentSuccess(
  response: RequestAndPurchaseAssetResponse,
): response is PaymentSuccessResponse {
  return 'receipt' in response && 'txSignature' in response;
}

/**
 * Payment status check parameters
 */
export interface CheckPaymentStatusPayload {
  /** API key for authentication */
  apiKey: string;

  /**
   * Invoice ID to check
   * @description Provide either invoiceId or transactionReference
   */
  invoiceId?: UUID;

  /**
   * Transaction reference to check
   * @description Provide either invoiceId or transactionReference
   */
  transactionReference?: string;
}

/**
 * Payment status response
 */
export interface CheckPaymentStatusResponse {
  /** Current payment status */
  status: InvoiceStatus;

  /** Transaction signature if payment is completed */
  transactionSignature?: TransactionSignature;

  /** Payment completion timestamp */
  completedAt?: ISODateTime;

  /** Error message if payment failed */
  errorMessage?: string;

  /** Additional status details */
  details?: {
    /** Number of confirmations on blockchain */
    confirmations?: number;
    /** Estimated completion time for pending payments */
    estimatedCompletionTime?: ISODateTime;
  };
}

/**
 * Streaming payment session parameters
 * @description Used for pay-as-you-go services and metered billing
 * @example
 * ```typescript
 * const session: IssuePaymentPayload = {
 *   apiKey: 'your_api_key',
 *   assetChunks: [
 *     { assetId: 'api-calls-product', quantity: 100 },
 *     { assetId: 'storage-gb-product', quantity: 10 }
 *   ],
 *   payingMerchantId: 'merchant-uuid'
 * };
 * ```
 */
export interface IssuePaymentPayload {
  /** API key for authentication */
  apiKey: string;

  /**
   * Assets to be consumed during streaming session
   * @description Each chunk represents a billable unit
   */
  assetChunks: BeepPurchaseAsset[];

  /**
   * Merchant ID who will be charged
   * @description Must have sufficient balance or credit
   */
  payingMerchantId: UUID;

  /**
   * Maximum session duration in minutes
   * @default 60
   * @min 1
   * @max 1440
   */
  maxDurationMinutes?: number;

  /**
   * Session metadata for tracking
   */
  metadata?: {
    /** Session purpose or description */
    purpose?: string;
    /** Client application ID */
    clientId?: string;
    /** Additional custom fields */
    [key: string]: unknown;
  };
}

/**
 * Streaming payment session response
 */
export interface IssuePaymentResponse {
  /** Unique session ID for streaming payment */
  sessionId: UUID;

  /** Invoice ID for the streaming session */
  invoiceId: UUID;

  /** Session expiration timestamp */
  expiresAt: ISODateTime;

  /** Current session status */
  status: 'active' | 'paused' | 'stopped' | 'expired';

  /** Estimated cost based on asset chunks */
  estimatedCost: {
    /** Minimum cost if session ends immediately */
    minimum: MoneyAmount;
    /** Maximum cost if session runs full duration */
    maximum: MoneyAmount;
  };
}

// Re-export other streaming types with enhanced documentation
export * from './streaming-payments';
