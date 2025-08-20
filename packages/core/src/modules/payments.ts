import { AxiosInstance } from 'axios';
import { RequestAndPurchaseAssetResponse, SignSolanaTransactionResponse } from '../types';
import {
  PaymentRequestData,
  RequestAndPurchaseAssetRequestParams,
  SignSolanaTransactionData,
  SignSolanaTransactionParams,
  IssuePaymentPayload,
  IssuePaymentResponse,
  StartStreamingPayload,
  StartStreamingResponse,
  PauseStreamingPayload,
  PauseStreamingResponse,
  StopStreamingPayload,
  StopStreamingResponse,
} from '../types';

export class PaymentsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async requestAndPurchaseAsset(
    input: RequestAndPurchaseAssetRequestParams,
  ): Promise<PaymentRequestData | null> {
    if (!input.paymentReference && !input.assetIds?.length) {
      console.error('One of paymentReference or assetIds is required');
      return null;
    }

    try {
      const response = await this.client.post<RequestAndPurchaseAssetResponse>(
        `/v1/payment/request-payment`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to request and purchase asset:', error);
      return null;
    }
  }

  public async signSolanaTransaction(
    input: SignSolanaTransactionParams,
  ): Promise<SignSolanaTransactionData | null> {
    if (
      !input.senderAddress ||
      !input.recipientAddress ||
      !input.tokenMintAddress ||
      !input.amount ||
      !input.decimals
    ) {
      console.error('Missing required fields');
      return null;
    }
    try {
      const response = await this.client.post<SignSolanaTransactionResponse>(
        '/v1/payment/sign-solana-transaction',
        input,
      );

      if (!response.data || !response.data.data) {
        throw new Error('No data returned from solana transaction signing');
      }

      return response.data.data;
    } catch (error: unknown) {
      // Rethrow with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to sign solana transaction: ${errorMessage}`);
    }
  }

  // --- Streaming Payment Methods ---

  /**
   * Issue a payment request for streaming with asset chunk details.
   */
  async issuePayment(payload: IssuePaymentPayload): Promise<IssuePaymentResponse> {
    const response = await this.client.post<IssuePaymentResponse>(
      '/v1/invoices/issue-payment',
      payload,
    );
    return response.data;
  }

  /**
   * Start a streaming session for the provided invoice.
   */
  async startStreaming(payload: StartStreamingPayload): Promise<StartStreamingResponse> {
    const response = await this.client.post<StartStreamingResponse>('/v1/invoices/start', payload);
    return response.data;
  }

  /**
   * Pause streaming on the provided invoice.
   */
  async pauseStreaming(payload: PauseStreamingPayload): Promise<PauseStreamingResponse> {
    const response = await this.client.post<PauseStreamingResponse>('/v1/invoices/pause', payload);
    return response.data;
  }

  /**
   * Stop streaming and close the provided invoice.
   */
  async stopStreaming(payload: StopStreamingPayload): Promise<StopStreamingResponse> {
    const response = await this.client.post<StopStreamingResponse>('/v1/invoices/stop', payload);
    return response.data;
  }
}
