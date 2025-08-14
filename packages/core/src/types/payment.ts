import { SupportedToken } from './token';
import { InvoiceStatus } from './invoice';

/**
 * Response type for payment request endpoints
 */
export interface PaymentRequestResponse {
  invoiceId: string;
  referenceKey: string;
  paymentUrl: string;
  qrCode: string;
  amount: number;
  splTokenAddress: string;
  expiresAt: Date;
  receivingMerchantId: string;
  status: InvoiceStatus;
}

/**
 * Payload for requesting a payment
 */
export interface RequestPaymentPayload {
  amount: number;
  token: SupportedToken;
  description?: string;
  splTokenAddress?: string;
  payerType?: string;
}

/**
 * Request interface for requesting and purchasing assets
 */
export interface RequestAndPurchaseAssetRequest {
  /** Array of asset IDs to request and purchase */
  assetIds?: string[];
  /** Reference identifier for the payment transaction */
  paymentReference?: string;
}
