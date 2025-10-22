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

export interface CreateCashPaymentOrderRequest {
  reference: string;
  walletAddress: string;
  amount: string;
  payWayCode: PayWayCode;
  email: string;
}

export interface CreateCashPaymentOrderResponse {
  payUrl: string;
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
  destinationAddress: string;
}

export interface PublicPaymentStatusResponse {
  paid: boolean;
  status?: InvoiceStatus | string;
}

export interface DynamicEnvResponse {
  environmentId: string;
}

export interface ProductWithPrices {
  /** External UUID for API references */
  uuid: string;
  /** UUID of the merchant who owns this product */
  merchantId: string;
  /** Display name for the product */
  name: string;
  /** Optional detailed description of the product */
  description: string | null;
  /** Whether product is available for purchase */
  active: boolean;
  /** Array of image URLs for product display */
  images: string[];
  /** Flexible key-value data for additional product information */
  metadata: Record<string, any>;
  /** Associated price information (most recent active price) */
  prices: Array<{
    /** External UUID for API references */
    uuid: string;
    /** The currency token (USDT, USDC, etc.) */
    token: string;
    /** Blockchain network (SOLANA, BASE, SUI) */
    chain: string;
    /** Base amount in smallest units. */
    amount: string;
    /** Type/description of billing unit */
    unitType: string;
    /** Unit amount for incremental billing */
    unitAmount: string;
    /** Size of each billing unit */
    unitSize: number;
    /** Whether this price is available for new purchases */
    active: boolean;
  }>;
}
/**
 * Response structure for the public products endpoint.
 */
export interface GetProductsResponse {
  /** Array of products with their associated prices */
  products: Array<ProductWithPrices>;
}
