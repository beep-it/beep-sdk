// Main entry point for the beep-sdk

import axios, { AxiosInstance } from 'axios';
import { PaymentsModule } from './modules/payments';
import { Invoice, SupportedToken } from './types';


// Configuration for the BeepClient
interface BeepClientOptions {
  apiKey: string;
  serverUrl?: string;
}

// Interface for the simplified payment request
export * from './types';

// Interface for the simplified payment request
export interface RequestPaymentPayload {
  amount: number;
  token?: SupportedToken; // The token type (USDC, etc.)
  splTokenAddress?: string; // Optional: The SPL token address (alternative to token)
  description: string;
  payerType?: 'customer_wallet' | 'merchant_wallet'; // Added payerType field to match API requirements
}

// The main client for interacting with the BEEP API
export class BeepClient {
  private client: AxiosInstance;
  public payments: PaymentsModule;


  constructor(options: BeepClientOptions) {
    this.client = axios.create({
      baseURL: options.serverUrl || 'https://api.beep.com', // Default to production URL
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Initialize modules
    this.payments = new PaymentsModule(this.client);

  }

  /**
   * The simplest way to request a payment. 
   * This one-stop method creates an invoice and prepares it for payment.
   * @param payload The details of the charge.
   * @returns A promise that resolves to the created invoice.
   */
  public async requestPayment(payload: RequestPaymentPayload): Promise<Invoice> {
    // Prepare the request payload
    const requestBody: Record<string, any> = {
      amount: payload.amount,
      description: payload.description
    };
    
    // Pass through splTokenAddress if provided, otherwise use token
    if (payload.splTokenAddress) {
      requestBody.splTokenAddress = payload.splTokenAddress;
    } else {
      requestBody.token = payload.token || SupportedToken.USDC; // Default to USDC if not specified
    }

    // Add payerType if provided
    if (payload.payerType) {
      requestBody.payerType = payload.payerType;
    }
    
    const response = await this.client.post<Invoice>('/v1/payments/request-payment', requestBody);
    return response.data;
  }

  // Example function
  public async healthCheck(): Promise<string> {
    try {
      const response = await this.client.get('/healthz');
      return response.data;
    } catch (error) {
      // In a real implementation, we would handle errors more gracefully
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
      } else {
        throw new Error('An unexpected error occurred.');
      }
    }
  }
}
