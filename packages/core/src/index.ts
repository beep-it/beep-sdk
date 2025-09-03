// Main entry point for the beep-sdk

import axios, { AxiosInstance } from 'axios';
import { InvoicesModule } from './modules/invoices';
import { PaymentsModule } from './modules/payments';
import { ProductsModule } from './modules/products';

// Configuration for the BeepClient
interface BeepClientOptions {
  apiKey: string;
  serverUrl?: string;
}

// The main client for interacting with the BEEP API
export class BeepClient {
  private client: AxiosInstance;
  public products: ProductsModule;
  public invoices: InvoicesModule;
  public payments: PaymentsModule;

  constructor(options: BeepClientOptions) {
    this.client = axios.create({
      baseURL: options.serverUrl || 'https://api.beep.com', // Default to production URL
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        'X-Beep-Client': 'beep-sdk',
      },
    });

    // Initialize modules
    this.products = new ProductsModule(this.client);
    this.invoices = new InvoicesModule(this.client);
    this.payments = new PaymentsModule(this.client);
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
