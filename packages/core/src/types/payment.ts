import { InvoiceStatus } from './invoice';
import { SupportedToken } from './token';
export interface BeepPurchaseAsset {
  assetId: string;
  quantity: number;
  name?: string;
  description?: string;
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
  /** Label to display on the payment request (e.g., merchant name) */
  paymentLabel?: string;
}

/**
 * 402 Flow semantics:
 * - Phase 1 (no paymentReference): server responds with HTTP 402 Payment Required and a payload
 *   containing referenceKey/paymentUrl/qrCode. The SDK returns that payload so callers can show
 *   a QR or deep link to the user.
 * - Phase 2 (with paymentReference): call again. When payment is complete, the response will NOT
 *   include referenceKey. If referenceKey is still present (or a 402 payload is returned), keep polling.
 */

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

/**
 * Payload for issuing a payment request that creates a streaming payment session
 *
 * This interface is used for server-to-server payment issuance where one merchant
 * (the paying party) creates a payment request for assets to be charged over time.
 *
 * **Important**: This functionality is only available with `BeepClient` using secret API keys.
 * It is NOT supported with `BeepPublicClient` or publishable keys for security reasons.
 *
 * @example
 * ```typescript
 * // Only works with BeepClient (server-side)
 * const beep = new BeepClient({ apiKey: 'secret_key_here' });
 *
 * const paymentRequest = await beep.payments.issuePayment({
 *   assetChunks: [
 *     { assetId: 'video-content-uuid', quantity: 1 },
 *     { assetId: 'api-access-uuid', quantity: 10 }
 *   ],
 *   payingMerchantId: 'merchant_abc123',
 *   invoiceId: 'existing_invoice_uuid' // optional
 * });
 * ```
 */
export interface IssuePaymentPayload {
  /**
   * Array of asset chunks to be purchased in this payment request
   * @remarks Each asset will be charged according to its configured pricing
   */
  assetChunks: BeepPurchaseAsset[];
  /**
   * ID of the merchant who will be charged for these assets
   * @remarks This is the paying party, not the receiving party
   */
  payingMerchantId: string;
  /**
   * Optional existing invoice ID to associate with this payment
   * @remarks If provided, assets will be added to the existing invoice
   */
  invoiceId?: string;
}

/**
 * Response returned after successfully issuing a payment
 *
 * Contains the identifiers needed to track and manage the streaming payment session.
 * The reference key can be used for status polling, and the invoice ID for payment management.
 */
export interface IssuePaymentResponse {
  /**
   * Unique reference key for tracking this streaming payment session
   * @remarks Use this key to poll payment status and manage the session
   */
  referenceKey: string;
  /**
   * UUID of the invoice created for this streaming payment
   * @remarks Use this ID for starting, pausing, or stopping the streaming session
   */
  invoiceId: string;
}

/**
 * Payload for starting a streaming payment session
 *
 * Initiates billing for a previously issued payment request. Once started,
 * the merchant will begin being charged for asset usage according to the
 * streaming payment configuration.
 *
 * **Important**: This functionality is only available with `BeepClient` using secret API keys.
 * It is NOT supported with `BeepPublicClient` or publishable keys.
 *
 * @example
 * ```typescript
 * // Start charging for the streaming session
 * const result = await beep.payments.startStreaming({
 *   invoiceId: 'invoice_uuid_from_issuePayment'
 * });
 * ```
 */
export interface StartStreamingPayload {
  /**
   * UUID of the invoice to start streaming charges for
   * @remarks This should be the invoiceId returned from issuePayment()
   */
  invoiceId: string;
}

/**
 * Response returned after successfully starting a streaming payment session
 *
 * Confirms that the streaming session has been activated and charging has begun.
 */
export interface StartStreamingResponse {
  /**
   * The UUID of the streaming invoice that was started
   * @remarks Matches the invoiceId from the request for confirmation
   */
  invoiceId: string;
}

/**
 * Payload for pausing an active streaming payment session
 *
 * Temporarily halts billing for a streaming session without terminating it.
 * The session can be resumed later using startStreaming() with the same invoice ID.
 *
 * **Important**: This functionality is only available with `BeepClient` using secret API keys.
 * It is NOT supported with `BeepPublicClient` or publishable keys.
 *
 * @example
 * ```typescript
 * // Temporarily pause billing
 * const result = await beep.payments.pauseStreaming({
 *   invoiceId: 'active_invoice_uuid'
 * });
 *
 * if (result.success) {
 *   console.log('Streaming paused successfully');
 * }
 * ```
 */
export interface PauseStreamingPayload {
  /**
   * UUID of the invoice to pause streaming for
   * @remarks Invoice must be in an active streaming state
   */
  invoiceId: string;
}

/**
 * Response returned after attempting to pause a streaming payment session
 *
 * Indicates whether the pause operation was successful.
 */
export interface PauseStreamingResponse {
  /**
   * Whether the streaming session was successfully paused
   * @remarks If false, check that the invoice is in a valid state for pausing
   */
  success: boolean;
}

/**
 * Payload for permanently stopping a streaming payment session
 *
 * Terminates a streaming session and finalizes all charges. This action cannot
 * be undone - the session cannot be restarted after stopping.
 *
 * **Important**: This functionality is only available with `BeepClient` using secret API keys.
 * It is NOT supported with `BeepPublicClient` or publishable keys.
 *
 * @example
 * ```typescript
 * // Permanently stop and finalize the streaming session
 * const result = await beep.payments.stopStreaming({
 *   invoiceId: 'active_invoice_uuid'
 * });
 *
 * console.log('Session stopped, reference keys:', result.referenceKeys);
 * ```
 */
export interface StopStreamingPayload {
  /**
   * UUID of the invoice to permanently stop streaming for
   * @remarks This action will finalize all charges and cannot be undone
   */
  invoiceId: string;
}

/**
 * Response returned after successfully stopping a streaming payment session
 *
 * Contains the final session details and all associated reference keys for record keeping.
 */
export interface StopStreamingResponse {
  /**
   * The UUID of the invoice that was stopped
   * @remarks Matches the invoiceId from the request for confirmation
   */
  invoiceId: string;
  /**
   * List of all reference keys associated with the streaming payments in this session
   * @remarks Useful for reconciliation and record keeping of all charges made
   */
  referenceKeys: string[];
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export interface CheckPaymentStatusPayload {
  /** The payment reference key to check */
  referenceKey: string;
}

export interface CheckPaymentStatusResponse {
  /** The current status of the payment (PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELED) */
  status: PayoutStatus | 'NOT_FOUND';
  /** The payout amount (if applicable) */
  amount?: string;
  /** The blockchain chain (if applicable) */
  chain?: string;
  /** The token type (if applicable) */
  token?: string;
  /** The destination wallet address (if applicable) */
  destinationWalletAddress?: string;
}
