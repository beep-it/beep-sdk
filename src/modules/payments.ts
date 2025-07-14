import { AxiosInstance } from 'axios';

// Interface for the pre-authorized payment request payload
export interface ExecutePreauthorizedPaymentRequest {
  invoiceId: string;
}

// Interface for the successful payment response
export interface PaymentResult {
  transactionHash: string;
  status: 'completed' | 'pending' | 'failed';
}

export class PaymentsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Executes a pre-authorized payment against a given invoice.
   * @param payload The payment request details.
   * @returns A promise that resolves to the payment result.
   */
  async executePreauthorized(payload: ExecutePreauthorizedPaymentRequest): Promise<PaymentResult> {
    // This endpoint corresponds to the `executePreauthorizedTransfer` method in beep-mcp's PaymentService
    const response = await this.client.post<PaymentResult>('/payments/execute-preauthorized', payload);
    return response.data;
  }
}
