/**
 * @fileoverview Main entry point for the BEEP SDK
 * Provides a unified client for interacting with the BEEP payment and invoice API
 */

import axios, { AxiosInstance } from 'axios';
import { InvoicesModule } from './modules/invoices';
import { PaymentsModule } from './modules/payments';
import { ProductsModule } from './modules/products';
import { WidgetModule } from './modules/widget';
import { UserModule } from './modules/user';

/**
 * Configuration options for initializing the BeepClient
 */
export interface BeepClientOptions {
  /** Your BEEP API key - keep this secure and never expose it in client-side code */
  apiKey: string;
  /**
   * Optional server URL override for development/testing
   * @default 'https://api.justbeep.it'
   */
  serverUrl?: string;
}

/**
 * The main BEEP SDK client for server-side applications using secret API keys
 *
 * **Use this client for:**
 * - Server-side applications (Node.js, Express, Next.js API routes)
 * - Backend services that can safely store secret API keys
 * - Full payment processing capabilities including streaming payments
 * - Administrative operations like product and invoice management
 *
 * **Security Note:** Never use BeepClient in client-side code (browsers) as it
 * requires secret API keys that should not be exposed publicly.
 *
 * @example
 * ```typescript
 * import { BeepClient, SupportedToken } from '@beep-it/sdk-core';
 *
 * // Only use this server-side with secret API keys
 * const beep = new BeepClient({
 *   apiKey: 'your_secret_api_key_here' // Keep this secure!
 * });
 *
 * // Create a payment request
 * const payment = await beep.requestPayment({
 *   amount: 10.00,
 *   token: SupportedToken.USDT,
 *   description: 'Premium subscription'
 * });
 *
 * // Issue streaming payments (BeepClient only)
 * const streamingSession = await beep.payments.issuePayment({
 *   apiKey: 'your_secret_api_key',
 *   assetChunks: [{ assetId: 'video-content', quantity: 1 }],
 *   payingMerchantId: 'merchant_id'
 * });
 * ```
 */
export class BeepClient {
  private client: AxiosInstance;

  /** Access to product management functionality (server-side only) */
  public readonly products: ProductsModule;

  /** Access to invoice management functionality (server-side only) */
  public readonly invoices: InvoicesModule;

  /**
   * Access to payment processing functionality including streaming payments
   *
   * **Note:** Streaming payment methods (issuePayment, startStreaming, pauseStreaming,
   * stopStreaming) are only available with BeepClient and secret API keys.
   */
  public readonly payments: PaymentsModule;
  /** Access to authenticated user info */
  public readonly user: UserModule;

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
      baseURL: options.serverUrl || 'https://api.justbeep.it',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'X-Beep-Client': 'beep-sdk',
      },
    });

    this.products = new ProductsModule(this.client);
    this.invoices = new InvoicesModule(this.client);
    this.payments = new PaymentsModule(this.client);
    this.user = new UserModule(this.client);
  }

  /**
   * Initiate a payout from your treasury wallet to an external address.
   * Requires a secret API key (server-side only).
   *
   * Notes:
   * - Do not pass walletId. The server derives the wallet based on your API key's merchant and requested chain.
   * - amount must be in smallest units for the token (e.g., 6‑decimals USDC amount as an integer string).
   * - This endpoint responds immediately with acceptance/rejection. Actual transfer executes asynchronously after funds are reserved.
   *
   * Example:
   * const res = await beep.payments.createPayout({
   *   amount: '1000000', // 1.0 USDC with 6 decimals
   *   destinationWalletAddress: 'DEST_ADDRESS',
   *   chain: 'SOLANA',
   *   token: 'USDC',
   * });
   */
  // Deprecated: use beep.payments.createPayout()

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
export type { BeepPurchaseAsset, PaymentRequestData, RequestPaymentPayload } from './types/payment';

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

// ------------------------------
// Public, browser-safe client
// ------------------------------

export interface BeepPublicClientOptions {
  /** Publishable key for browser access; safe to embed in clients */
  publishableKey: string;
  /** Optional server URL override */
  serverUrl?: string;
}

/**
 * Browser-safe BEEP client for frontend applications using publishable keys
 *
 * **Use this client for:**
 * - Frontend applications (React, Vue, vanilla JavaScript)
 * - Browser-based code where secret keys cannot be safely stored
 * - Widget-based payment sessions with ephemeral items
 * - Client-side payment status polling
 *
 * **Limitations compared to BeepClient:**
 * - Cannot access streaming payment methods (issuePayment, startStreaming, etc.)
 * - Cannot manage products or invoices directly
 * - Limited to public widget endpoints only
 * - No access to administrative functions
 *
 * **Security:** Uses publishable keys which are safe to expose in client-side code.
 *
 * @example
 * ```typescript
 * import { BeepPublicClient } from '@beep-it/sdk-core';
 *
 * // Safe to use in browsers with publishable keys
 * const publicBeep = new BeepPublicClient({
 *   publishableKey: 'beep_pk_your_publishable_key_here' // Safe to expose
 * });
 *
 * // Create payment sessions with mixed assets
 * const session = await publicBeep.widget.createPaymentSession({
 *   assets: [
 *     { assetId: 'existing-product-uuid', quantity: 1 },
 *     { name: 'Custom Item', price: '12.50', quantity: 1 }
 *   ],
 *   paymentLabel: 'My Store'
 * });
 *
 * // Poll for payment completion
 * const { paid } = await publicBeep.widget.waitForPaid({
 *   referenceKey: session.referenceKey
 * });
 * ```
 */
export class BeepPublicClient {
  private client: AxiosInstance;

  /**
   * Access to public widget endpoints for payment sessions
   *
   * **Note:** This is the only module available in BeepPublicClient.
   * Streaming payments, product management, and administrative functions
   * are only available in BeepClient with secret API keys.
   */
  public readonly widget: WidgetModule;

  /**
   * Creates a new BEEP public client instance for browser use
   *
   * @param options - Configuration options including publishable key
   * @throws {Error} When publishable key is missing or invalid
   */
  constructor(options: BeepPublicClientOptions) {
    if (!options.publishableKey) {
      throw new Error('publishableKey is required to initialize BeepPublicClient');
    }

    this.client = axios.create({
      baseURL: options.serverUrl || 'https://api.justbeep.it',
      headers: {
        'Content-Type': 'application/json',
        'X-Beep-Client': 'beep-sdk',
        Authorization: `Bearer ${options.publishableKey}`,
      },
    });

    this.widget = new WidgetModule(this.client);
  }
}

export type {
  PublicPaymentSessionRequest,
  PublicPaymentSessionResponse,
  PublicPaymentStatusResponse,
  EphemeralItem,
} from './types/public';
