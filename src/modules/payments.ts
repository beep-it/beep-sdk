import { AxiosInstance } from 'axios';

import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  Invoice,
  CreateInvoicePayload,
  SupportedToken,
  TokenUtils
} from '../types';

export class PaymentsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  // --- Product Methods ---

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    // Convert token to splTokenAddress if needed
    const requestPayload = { ...payload };
    if (requestPayload.token && !requestPayload.splTokenAddress) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token);
    }
    
    const response = await this.client.post<Product>('/v1/products', requestPayload);
    return response.data;
  }

  async getProduct(productId: string): Promise<Product> {
    const response = await this.client.get<Product>(`/v1/products/${productId}`);
    return response.data;
  }

  async listProducts(): Promise<Product[]> {
    const response = await this.client.get<Product[]>('/v1/products');
    return response.data;
  }

  async updateProduct(
    productId: string,
    payload: UpdateProductPayload,
  ): Promise<Product> {
    // Convert token to splTokenAddress if needed
    const requestPayload = { ...payload };
    if (requestPayload.token && !requestPayload.splTokenAddress) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token);
    }
    
    const response = await this.client.put<Product>(
      `/v1/products/${productId}`,
      requestPayload,
    );
    return response.data;
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.client.delete(`/v1/products/${productId}`);
  }

  // --- Invoice Methods ---

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

