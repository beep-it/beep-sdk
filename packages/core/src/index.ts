/**
 * @fileoverview Main entry point for the BEEP SDK
 * Provides a unified client for interacting with the BEEP payment and invoice API
 */

import axios, { AxiosInstance } from 'axios';
import { InvoicesModule } from './modules/invoices';
import { PaymentsModule } from './modules/payments';
import { ProductsModule } from './modules/products';

/**
 * Configuration options for initializing the BeepClient
 */
export interface BeepClientOptions {
  /** Your BEEP API key - keep this secure and never expose it in client-side code */
  apiKey: string;
  /**
   * Optional server URL override for development/testing
   * @default 'https://api.beep.com'
   */
  serverUrl?: string;
}

/**
 * The main BEEP SDK client for interacting with the BEEP API
 *
 * @example
 * ```typescript
 * import { BeepClient, SupportedToken } from '@beep-it/sdk-core';
 *
 * const beep = new BeepClient({
 *   apiKey: 'your_api_key_here'
 * });
 *
 * // Create a payment request
 * const payment = await beep.requestPayment({
 *   amount: 10.00,
 *   token: SupportedToken.USDT,
 *   description: 'Premium subscription'
 * });
 * ```
 */
export class BeepClient {
  private client: AxiosInstance;

  /** Access to product management functionality */
  public readonly products: ProductsModule;

  /** Access to invoice management functionality */
  public readonly invoices: InvoicesModule;

  /** Access to payment processing functionality */
  public readonly payments: PaymentsModule;

  /**
   * Creates a new BEEP client instance
   *
   * @param options - Configuration options including API key and optional server URL
   * @throws {Error} When API key is missing or invalid
   */
  constructor(options: BeepClientOptions) {
    if (!options.apiKey) {
      throw new Error('API key is required to initialize BeepClient');
    }

    this.client = axios.create({
      baseURL: options.serverUrl || 'https://api.beep.com',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'X-Beep-Client': 'beep-sdk',
      },
    });

    this.products = new ProductsModule(this.client);
    this.invoices = new InvoicesModule(this.client);
    this.payments = new PaymentsModule(this.client);
  }

  /**
   * Checks the health status of the BEEP API server
   *
   * @returns Promise that resolves to the server health status
   * @throws {Error} When the API is unreachable or returns an error
   *
   * @example
   * ```typescript
   * const status = await beep.healthCheck();
   * console.log('Server status:', status);
   * ```
   */
  public async healthCheck(): Promise<string> {
    try {
      const response = await this.client.get('/healthz');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('An unexpected error occurred during health check');
    }
  }
}

// Selective exports - only export what consumers actually need

// Main client class is already exported above

// Essential types for payment operations
export type { PaymentRequestData, RequestPaymentPayload } from './types/payment';

// Invoice management types
export type {
  CreateCustomInvoicePayload,
  CreateInvoiceFromProductPayload,
  CreateInvoicePayload,
  Invoice,
  InvoiceStatus,
  PayerType,
} from './types/invoice';

// Product management types
export type { CreateProductPayload, Product, UpdateProductPayload } from './types/product';

// Token utilities and enums
export { SupportedToken, TokenUtils } from './types/token';

// Core response types that consumers might need
export type { BeepResponse } from './types';
