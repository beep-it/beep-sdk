import { BeepPurchaseAsset } from './payment';
import { SupportedToken } from './token';
import { InvoiceStatus } from './invoice';
import { PayWayCode } from './cash-payment';

/**
 * On-the-fly item sent from the browser. The server will create a corresponding product record
 * during the payment-session so it is persisted for audit/reuse. Safe to send from clients.
 */
export interface EphemeralItem {
  name: string;
  price: string; // decimal string e.g. "12.50"
  quantity?: number;
  token?: SupportedToken; // default: USDC
  description?: string;
}

export type PublicAssetInput = BeepPurchaseAsset | EphemeralItem;

export interface PublicPaymentSessionRequest {
  publishableKey: string;
  assets: PublicAssetInput[];
  paymentLabel?: string;
  generateQrCode?: boolean;
}

export interface GeneratePaymentQuoteRequest {
  amount: string;
  walletAddress: string;
  payWayCode?: PayWayCode;
}

interface PaymentLimit {
  /** Country code (e.g., 'US') */
  country: string;
  /** Payment method code */
  payWayCode: PayWayCode;
  /** Minimum purchase amount in fiat currency */
  minPurchaseAmount: string;
  /** Maximum purchase amount in fiat currency */
  maxPurchaseAmount: string;
}

export interface GeneratePaymentQuoteResponse {
  fiatAmount: string;
  networkFee: string;
  rampFee: string;
  supportedPaymentMethods: PaymentLimit[];
}

export interface GenerateCashPaymentUrlRequest {
  reference: string;
  amount: string;
  walletAddress: string;
}

export interface GenerateCashPaymentUrlResponse {
  paymentUrl: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
}

export interface GenerateOTPRequest {
  email: string;
  tosAccepted: boolean;
}

export interface GenerateOTPResponse {
  verificationCode?: string;
  newCodeGenerated: boolean;
}

export interface PublicPaymentSessionResponse {
  referenceKey: string;
  paymentUrl: string;
  qrCode?: string;
  amount: string; // decimal string
  expiresAt: string | Date;
  status: InvoiceStatus | string;
  isCashPaymentEligible: boolean;
}

export interface PublicPaymentStatusResponse {
  paid: boolean;
  status?: InvoiceStatus | string;
}

export interface DynamicEnvResponse {
  environmentId: string;
}
