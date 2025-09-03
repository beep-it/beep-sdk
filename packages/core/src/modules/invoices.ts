import { AxiosInstance } from 'axios';

import {
  Invoice,
  CreateInvoicePayload,
  SupportedToken,
  TokenUtils
} from '../types';

/**
 * Module for managing invoices in the BEEP payment system
 * Provides CRUD operations for invoices with support for both product-based and custom invoices
 */
export class InvoicesModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a new invoice for payment processing
   * Supports both product-based invoices (linked to existing products) and custom invoices
   * 
   * @param payload - Invoice creation parameters (product-based or custom)
   * @returns Promise that resolves to the created invoice
   * @throws {Error} When invoice creation fails
   * 
   * @example
   * ```typescript
   * // Create invoice from existing product
   * const productInvoice = await beep.invoices.createInvoice({
   *   productId: 'prod_123',
   *   payerType: 'customer_wallet'
   * });
   * 
   * // Create custom invoice
   * const customInvoice = await beep.invoices.createInvoice({
   *   description: 'Consulting services',
   *   amount: '100.00',
   *   token: SupportedToken.USDT,
   *   payerType: 'customer_wallet'
   * });
   * ```
   */
  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const requestPayload = { ...payload };
    
    // Convert token enum to SPL address for API compatibility
    if ('token' in requestPayload && !('splTokenAddress' in requestPayload)) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token as SupportedToken);
    }
    
    const response = await this.client.post<Invoice>('/v1/invoices', requestPayload);
    return response.data;
  }

  /**
   * Retrieves a specific invoice by its ID
   * 
   * @param invoiceId - The unique identifier of the invoice to retrieve
   * @returns Promise that resolves to the invoice details
   * @throws {Error} When the invoice is not found or retrieval fails
   * 
   * @example
   * ```typescript
   * const invoice = await beep.invoices.getInvoice('inv_123abc456def');
   * console.log('Invoice status:', invoice.status);
   * console.log('Payment URL:', invoice.paymentUrl);
   * ```
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.client.get<Invoice>(`/v1/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Retrieves all invoices for the current merchant
   * 
   * @returns Promise that resolves to an array of invoices
   * @throws {Error} When invoice retrieval fails
   * 
   * @example
   * ```typescript
   * const invoices = await beep.invoices.listInvoices();
   * const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
   * console.log(`Found ${pendingInvoices.length} pending invoices`);
   * ```
   */
  async listInvoices(): Promise<Invoice[]> {
    const response = await this.client.get<Invoice[]>('/v1/invoices');
    return response.data;
  }

  /**
   * Deletes an existing invoice
   * 
   * @param invoiceId - The unique identifier of the invoice to delete
   * @returns Promise that resolves when the invoice is successfully deleted
   * @throws {Error} When the invoice is not found or deletion fails
   * 
   * @remarks Once deleted, an invoice cannot be recovered. Use with caution.
   * 
   * @example
   * ```typescript
   * await beep.invoices.deleteInvoice('inv_123abc456def');
   * console.log('Invoice deleted successfully');
   * ```
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.client.delete(`/v1/invoices/${invoiceId}`);
  }
}