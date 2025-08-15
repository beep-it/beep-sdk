import { AxiosInstance } from 'axios';

import {
  Invoice,
  CreateInvoicePayload,
  SupportedToken,
  TokenUtils
} from '../types';

export class InvoicesModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    // Handle both product-based and custom invoices with token support
    const requestPayload = { ...payload };
    
    // For custom invoices with token instead of splTokenAddress
    if ('token' in requestPayload && !('splTokenAddress' in requestPayload)) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token as SupportedToken);
    }
    
    const response = await this.client.post<Invoice>('/v1/invoices', requestPayload);
    return response.data;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.client.get<Invoice>(`/v1/invoices/${invoiceId}`);
    return response.data;
  }

  async listInvoices(): Promise<Invoice[]> {
    const response = await this.client.get<Invoice[]>('/v1/invoices');
    return response.data;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.client.delete(`/v1/invoices/${invoiceId}`);
  }
}