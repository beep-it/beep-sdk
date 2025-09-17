import { BeepPurchaseAsset } from './payment';
import { SupportedToken } from './token';
import { InvoiceStatus } from './invoice';

/**
 * On-the-fly item sent from the browser. The server will create a corresponding product record
 * during the payment-session so it is persisted for audit/reuse. Safe to send from clients.
 */
export interface EphemeralItem {
  name: string;
  price: string; // decimal string e.g. "12.50"
  quantity?: number;
  token?: SupportedToken; // default: USDT
  description?: string;
}

export type PublicAssetInput = BeepPurchaseAsset | EphemeralItem;

export interface PublicPaymentSessionRequest {
  publishableKey: string;
  assets: PublicAssetInput[];
  paymentLabel?: string;
  generateQrCode?: boolean;
}

export interface PublicPaymentSessionResponse {
  referenceKey: string;
  paymentUrl: string;
  qrCode?: string;
  amount: string; // decimal string
  expiresAt: string | Date;
  status: InvoiceStatus | string;
}

export interface PublicPaymentStatusResponse {
  paid: boolean;
  status?: InvoiceStatus | string;
}
