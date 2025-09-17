import { AxiosInstance } from 'axios';
import {
  PublicPaymentSessionRequest,
  PublicPaymentSessionResponse,
  PublicPaymentStatusResponse,
} from '../types/public';

export class WidgetModule {
  private client: AxiosInstance;
  private publishableKey: string;

  constructor(client: AxiosInstance, publishableKey: string) {
    this.client = client;
    this.publishableKey = publishableKey;
  }

  /**
   * Creates a payment session (public, CORS-open) for Checkout Widget
   */
  async createPaymentSession(
    input: Omit<PublicPaymentSessionRequest, 'publishableKey'>,
  ): Promise<PublicPaymentSessionResponse> {
    const body: PublicPaymentSessionRequest = {
      publishableKey: this.publishableKey,
      assets: input.assets,
      paymentLabel: input.paymentLabel,
      generateQrCode: input.generateQrCode ?? true,
    };
    const res = await this.client.post<PublicPaymentSessionResponse>(
      '/v1/widget/payment-session',
      body,
    );
    return res.data;
  }

  /**
   * Retrieves payment status for a reference key
   */
  async getPaymentStatus(referenceKey: string): Promise<PublicPaymentStatusResponse> {
    const res = await this.client.get<PublicPaymentStatusResponse>(
      `/v1/widget/payment-status/${encodeURIComponent(referenceKey)}`,
    );
    return res.data;
  }
}
