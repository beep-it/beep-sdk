import { SupportedToken } from './token';

export type PayerType = 'customer_wallet' | 'merchant_wallet';

export interface Invoice {
  id: string;
  merchantId: string;
  payerType: PayerType;
  payerMerchantId: string | null;
  description: string;
  amount: string;
  splTokenAddress: string;
  token?: SupportedToken; // Added token enum field
  status: 'pending' | 'paid' | 'expired';
  referenceKey: string;
  createdAt: Date;
  updatedAt: Date;
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
