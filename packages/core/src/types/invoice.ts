import { SupportedToken } from './token';

export type PayerType = 'customer_wallet' | 'merchant_wallet';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export interface Invoice {
  id?: string; // API returns this property instead of id
  receivingMerchantId?: string; // API uses this instead of merchantId
  merchantId?: string;
  payerType?: PayerType;
  payerMerchantId?: string | null;
  description?: string;
  amount?: number | string;
  splTokenAddress?: string;
  token?: SupportedToken;
  status?: 'pending' | 'paid' | 'expired';
  referenceKey?: string;
  paymentUrl?: string; // Added for API response
  qrCode?: string; // Added for API response
  expiresAt?: string | Date; // API returns expiresAt
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateInvoiceFromProductPayload {
  productId: string;
  payerType: PayerType;
  payerMerchantId?: string;
}

export interface CreateCustomInvoicePayload {
  description: string;
  amount: string;
  token?: SupportedToken; // Added token enum field
  splTokenAddress?: string; // Now optional if token is provided
  payerType: PayerType;
  payerMerchantId?: string;
}

export type CreateInvoicePayload = CreateInvoiceFromProductPayload | CreateCustomInvoicePayload;
