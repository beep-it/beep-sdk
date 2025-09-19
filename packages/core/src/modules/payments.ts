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

/**
 * Module for handling payment operations including asset purchases and Solana transactions
 * Provides methods for creating payment requests and signing blockchain transactions
 */
export class PaymentsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a payment request for purchasing assets
   *
   * @param input - Parameters for the asset purchase request
   * @returns Promise that resolves to payment request data, or null if validation fails
   *
   * @example
   * ```typescript
   * const payment = await beep.payments.requestAndPurchaseAsset({
   *   paymentReference: 'premium_subscription_123',
   *   assetIds: ['asset_1', 'asset_2']
   * });
   *
   * if (payment) {
   *   console.log('Payment URL:', payment.paymentUrl);
   * }
   * ```
   */
  async requestAndPurchaseAsset(
    input: RequestAndPurchaseAssetRequestParams,
  ): Promise<PaymentRequestData | null> {
    if (!input.paymentReference && !input.assets?.length) {
      console.error('One of paymentReference or assets is required');
      return null;
    }

    try {
      const response = await this.client.post<RequestAndPurchaseAssetResponse>(
        `/v1/payment/request-payment`,
        input,
      );
      return response.data.data;
    } catch (error) {
      if ((error as any).response?.status === 402) {
        return (error as any).response?.data?.data;
      }
      console.error('Failed to request and purchase asset:', error);
      return null;
    }
  }

  /**
   * Signs a Solana transaction for direct blockchain payment processing
   *
   * @param input - Transaction parameters including addresses, amounts, and token details
   * @returns Promise that resolves to signed transaction data
   * @throws {Error} When transaction signing fails or required fields are missing
   *
   * @example
   * ```typescript
   * try {
   *   const signedTx = await beep.payments.signSolanaTransaction({
   *     senderAddress: 'sender_wallet_address',
   *     recipientAddress: 'recipient_wallet_address',
   *     tokenMintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
   *     amount: 1000000, // 1.0 USDT in base units
   *     decimals: 6
   *   });
   *
   *   if (signedTx) {
   *     console.log('Transaction ready for broadcast:', signedTx.signedTransaction);
   *   }
   * } catch (error) {
   *   console.error('Transaction signing failed:', error);
   * }
   * ```
   */
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
