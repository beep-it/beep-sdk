import { InvoiceStatus } from './invoice';
import { SupportedToken } from './token';

export interface BeepPurchaseAsset {
  assetId: string;
  quantity: number;
}

export interface RequestAndPurchaseAssetRequestParams {
  /** Array of assets (IDs, quantity) to request and purchase */
  assets: BeepPurchaseAsset[];
  /** Reference identifier for the payment transaction */
  paymentReference?: string;
  /** Generates a QR code if true. */
  generateQrCode?: boolean;
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

/**
 * Response if the invoice is paid.
 */
export interface PaymentRequestPaidData {
  type: string;
  value: object[];
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
