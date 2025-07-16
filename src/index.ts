// Main entry point for the beep-sdk

import axios, { AxiosInstance } from 'axios';
import { PaymentsModule } from './modules/payments';
import { PaymentRequestResponse } from './types/payment';
import { SupportedToken, TOKEN_DECIMALS } from './types/token';


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
  /**
   * Converts a decimal amount to base units based on token decimals
   * @param amount The decimal amount (e.g., 0.01)
   * @param token The token type
   * @returns The amount in base units as an integer (e.g., 10000 for 0.01 USDC)
   */
  private convertAmountToBaseUnits(amount: number, token: SupportedToken): number {
    const decimals = TOKEN_DECIMALS[token] || 6; // Default to 6 if not found
    // Convert to integer base units: amount * (10^decimals)
    return Math.round(amount * Math.pow(10, decimals));
  }

  public async requestPayment(payload: {
    amount: number;
    token?: SupportedToken;
    description?: string;
    splTokenAddress?: string;
    payerType?: string;
  }): Promise<PaymentRequestResponse> {
    // Prepare the request payload
    const requestBody: {
      description: string;
      amount?: number;
      splTokenAddress?: string;
      token?: SupportedToken;
      payerType?: string;
    } = {
      description: payload.description || 'Payment request' // Provide a default description
    };
    
    // Determine token type
    const token = payload.token || SupportedToken.USDC; // Default to USDC if not specified
    
    // Pass through splTokenAddress if provided, otherwise use token
    if (payload.splTokenAddress) {
      requestBody.splTokenAddress = payload.splTokenAddress;
    } else {
      // Token is guaranteed to be defined because we set a default value above
      requestBody.token = token as SupportedToken;
    }
    
    // Convert decimal amount to base units
    requestBody.amount = this.convertAmountToBaseUnits(payload.amount, token);

    // Add payerType if provided
    if (payload.payerType) {
      requestBody.payerType = payload.payerType;
    }
    
    try {
      const response = await this.client.post<PaymentRequestResponse>('/v1/payment/request-payment', requestBody);
      
      if (!response.data) {
        throw new Error('No data returned from payment request');
      }
      
      return response.data;
    } catch (error: unknown) {
      // Rethrow with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to request payment: ${errorMessage}`);
    }
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
