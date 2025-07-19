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
