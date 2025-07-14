// Main entry point for the beep-sdk

import axios, { AxiosInstance } from 'axios';
import { WalletsModule } from './modules/wallets';
import { PaymentsModule } from './modules/payments';
import { InvoicesModule, Invoice } from './modules/invoices';

// Configuration for the BeepClient
interface BeepClientOptions {
  apiKey: string;
  serverUrl?: string;
}

// Interface for the simplified payment request
export interface RequestPaymentPayload {
  amount: number;
  currency: string;
  description: string;
  payerId: string; // The ID of the user or merchant who will be paying.
}

// The main client for interacting with the BEEP API
export class BeepClient {
  private client: AxiosInstance;
  public wallets: WalletsModule;
  public payments: PaymentsModule;
  public invoices: InvoicesModule;

  constructor(options: BeepClientOptions) {
    this.client = axios.create({
      baseURL: options.serverUrl || 'https://api.beep.com', // Default to production URL
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Initialize modules
    this.wallets = new WalletsModule(this.client);
    this.payments = new PaymentsModule(this.client);
    this.invoices = new InvoicesModule(this.client);
  }

  /**
   * The simplest way to request a payment. 
   * This one-stop method creates an invoice and prepares it for payment.
   * @param payload The details of the charge.
   * @returns A promise that resolves to the created invoice.
   */
  public async requestPayment(payload: RequestPaymentPayload): Promise<Invoice> {
    const response = await this.client.post<Invoice>('/request-payment', payload);
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
