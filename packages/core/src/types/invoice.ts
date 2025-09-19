import { SupportedToken } from './token';

/**
 * Specifies who is responsible for paying an invoice
 */
export type PayerType = 'customer_wallet' | 'merchant_wallet';

/**
 * Enumeration of possible invoice statuses throughout the payment lifecycle
 */
export enum InvoiceStatus {
  /** Invoice created but payment not yet initiated */
  PENDING = 'pending',
  /** Payment received but not yet confirmed on blockchain */
  PAID = 'paid',
  /** Payment confirmed on blockchain */
  CONFIRMED = 'confirmed',
  /** Invoice expired without payment */
  EXPIRED = 'expired',
  /** Payment failed or was rejected */
  FAILED = 'failed',
}

/**
 * Represents an invoice in the BEEP payment system
 * Contains all information about a payment request and its current state
 */
export interface Invoice {
  /** Unique identifier for this invoice */
  id?: string;
  /** ID of the merchant who will receive payment from this invoice */
  receivingMerchantId?: string;
  /** 
   * @deprecated Use receivingMerchantId instead
   * Legacy field maintained for backwards compatibility
   */
  merchantId?: string;
  /** Specifies whether customer or merchant wallet pays this invoice */
  payerType?: PayerType;
  /** ID of the merchant paying (when payerType is 'merchant_wallet') */
  payerMerchantId?: string | null;
  /** Human-readable description of what this invoice is for */
  description?: string;
  /** Invoice amount (can be number or string depending on context) */
  amount?: number | string;
  /** SPL token address for the payment token */
  splTokenAddress?: string;
  /** Token type for this invoice */
  token?: SupportedToken;
  /** Current status of this invoice in the payment flow */
  status?: 'pending' | 'paid' | 'expired';
  /** Unique reference key for tracking this invoice */
  referenceKey?: string;
  /** URL where customers can pay this invoice */
  paymentUrl?: string;
  /** QR code for mobile payment (contains same info as paymentUrl) */
  qrCode?: string;
  /** When this invoice expires and becomes unpayable */
  expiresAt?: string | Date;
  /** When this invoice was created */
  createdAt?: Date;
  /** When this invoice was last updated */
  updatedAt?: Date;
}

/**
 * Payload for creating an invoice based on an existing product
 * Links the invoice to a pre-configured product with set pricing
 */
export interface CreateInvoiceFromProductPayload {
  /** ID of the product to create an invoice for */
  productId: string;
  /** Who will be paying for this invoice */
  payerType: PayerType;
  /** 
   * ID of the merchant paying (required when payerType is 'merchant_wallet')
   * @remarks Only relevant for merchant-to-merchant transactions
   */
  payerMerchantId?: string;
}

/**
 * Payload for creating a custom invoice with ad-hoc pricing and details
 * Use this for one-off payments that don't correspond to a product
 */
export interface CreateCustomInvoicePayload {
  /** Description of what this payment is for */
  description: string;
  /** Amount to charge as a string (e.g., "10.50") */
  amount: string;
  /** 
   * Token type to use for payment
   * @remarks Preferred over splTokenAddress for supported tokens
   */
  token?: SupportedToken;
  /** 
   * Custom SPL token address (alternative to token)
   * @remarks Use this for tokens not in the SupportedToken enum
   */
  splTokenAddress?: string;
  /** Who will be paying for this invoice */
  payerType: PayerType;
  /** 
   * ID of the merchant paying (required when payerType is 'merchant_wallet')
   * @remarks Only relevant for merchant-to-merchant transactions
   */
  payerMerchantId?: string;
}

/**
 * Union type representing all possible invoice creation payloads
 * Allows for both product-based and custom invoice creation
 */
export type CreateInvoicePayload = CreateInvoiceFromProductPayload | CreateCustomInvoicePayload;
