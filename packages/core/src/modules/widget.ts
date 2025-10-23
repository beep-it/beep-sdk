import { AxiosError, AxiosInstance } from 'axios';
import {
  GenerateOTPRequest,
  GenerateOTPResponse,
  DynamicEnvResponse,
  CreateCashPaymentOrderRequest,
  CreateCashPaymentOrderResponse,
  PublicPaymentSessionRequest,
  PublicPaymentSessionResponse,
  PublicPaymentStatusResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  GeneratePaymentQuoteRequest,
  GeneratePaymentQuoteResponse,
  GetProductsResponse,
} from '../types/public';

export class WidgetModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a payment session (public, CORS-open) for Checkout Widget
   */
  async createPaymentSession(
    input: PublicPaymentSessionRequest,
  ): Promise<PublicPaymentSessionResponse> {
    const body: PublicPaymentSessionRequest = {
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

  async generateOTP(input: GenerateOTPRequest) {
    const res = await this.client.post<GenerateOTPResponse>('/v1/widget/generate-otp', {
      ...input,
    });
    return res.data;
  }

  async verifyOTP(input: VerifyOTPRequest) {
    const res = await this.client.post<VerifyOTPResponse>('/v1/widget/verify-otp', {
      ...input,
    });
    return res.data;
  }

  async generatePaymentQuote(input: GeneratePaymentQuoteRequest) {
    const res = await this.client.post<GeneratePaymentQuoteResponse>(
      '/v1/widget/generate-payment-quote',
      {
        ...input,
      },
    );
    return res.data;
  }

  async createCashPaymentOrder(input: CreateCashPaymentOrderRequest) {
    const res = await this.client.post<CreateCashPaymentOrderResponse>(
      '/v1/widget/create-cash-payment-order',
      {
        ...input,
      },
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

  /**
   * Waits for payment completion by polling the public status endpoint until paid or timeout.
   * Designed for browser/public usage (no secret keys).
   */
  async waitForPaid(options: {
    referenceKey: string;
    intervalMs?: number; // default 15s
    timeoutMs?: number; // default 5 min
    signal?: AbortSignal;
    onUpdate?: (status: PublicPaymentStatusResponse) => void;
    onError?: (error: unknown) => void;
  }): Promise<{ paid: boolean; last?: PublicPaymentStatusResponse }> {
    const baseIntervalMs = options.intervalMs ?? 15_000;
    let currentIntervalMs = baseIntervalMs;
    const timeoutMs = options.timeoutMs ?? 5 * 60_000;
    const deadline = Date.now() + timeoutMs;

    let last: PublicPaymentStatusResponse | undefined;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (options.signal?.aborted) return { paid: false, last };
      try {
        const res = await this.client.get<PublicPaymentStatusResponse>(
          `/v1/widget/payment-status/${encodeURIComponent(options.referenceKey)}`,
        );
        last = res.data;
        options.onUpdate?.(last);
        if (last?.paid) return { paid: true, last };
        // Reset backoff on a successful round-trip
        currentIntervalMs = baseIntervalMs;
      } catch (err) {
        options.onError?.(err);
        const ax = err as AxiosError<any>;
        const status = ax.response?.status;
        // Fatal for invalid/missing reference keys: abort early
        if (status && [400, 401, 403, 404, 422].includes(status)) {
          return { paid: false, last };
        }
        // Transient (429/5xx/network): backoff and continue
        currentIntervalMs = Math.min(Math.ceil(currentIntervalMs * 1.5), 60_000);
      }
      if (Date.now() >= deadline) return { paid: false, last };
      await new Promise((r) => setTimeout(r, currentIntervalMs));
    }
  }

  async getDynamicEnv() {
    const res = await this.client.get<DynamicEnvResponse>('/v1/widget/environment');
    return res.data;
  }

  async getProducts() {
    const res = await this.client.get<GetProductsResponse>('/v1/widget/products');
    return res.data;
  }
}
