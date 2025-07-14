import { AxiosInstance } from 'axios';

// Interface for the payer of an invoice
export interface InvoicePayer {
  type: 'merchant' | 'user';
  id: string;
}

// Interface for creating a new invoice
export interface CreateInvoiceRequest {
  amount: number;
  currency: string;
  description?: string;
  payer: InvoicePayer;
}

// Interface representing a created invoice
export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  description?: string;
  createdAt: string;
}

export class InvoicesModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a new invoice.
   * @param payload The details for the new invoice.
   * @returns A promise that resolves to the created invoice.
   */
  async create(payload: CreateInvoiceRequest): Promise<Invoice> {
    const response = await this.client.post<Invoice>('/invoices', payload);
    return response.data;
  }

  /**
   * Retrieves a list of all invoices.
   * @returns A promise that resolves to an array of invoices.
   */
  async list(): Promise<Invoice[]> {
    const response = await this.client.get<Invoice[]>('/invoices');
    return response.data;
  }

  /**
   * Retrieves a single invoice by its ID.
   * @param invoiceId The ID of the invoice to retrieve.
   * @returns A promise that resolves to the invoice.
   */
  async get(invoiceId: string): Promise<Invoice> {
    const response = await this.client.get<Invoice>(`/invoices/${invoiceId}`);
    return response.data;
  }
}
