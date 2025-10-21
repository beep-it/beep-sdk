import { AxiosError, AxiosInstance } from 'axios';
import {
  BeepPurchaseAsset,
  CheckPaymentStatusPayload,
  CheckPaymentStatusResponse,
  IssuePaymentPayload,
  IssuePaymentResponse,
  PauseStreamingPayload,
  PauseStreamingResponse,
  PaymentRequestData,
  RequestAndPurchaseAssetRequestParams,
  RequestAndPurchaseAssetResponse,
  SignSolanaTransactionData,
  SignSolanaTransactionParams,
  SignSolanaTransactionResponse,
  StartStreamingPayload,
  StartStreamingResponse,
  StopStreamingPayload,
  StopStreamingResponse,
} from '../types';
import { InvoiceStatus } from '../types/invoice';

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
   * Initiate a payout from your treasury wallet to an external address.
   * Requires a secret API key (server-side only).
   *
   * Notes:
   * - Do not pass walletId. The server derives the wallet based on your API key's merchant and requested chain.
   * - amount must be in smallest units for the token (e.g., 6‑decimals USDC amount as an integer string).
   * - This endpoint responds immediately with acceptance/rejection. Actual transfer executes asynchronously after funds are reserved.
   *
   * Example:
   * const res = await beep.payments.createPayout({
   *   amount: '1000000', // 1.0 USDC with 6 decimals
   *   destinationWalletAddress: 'DEST_ADDRESS',
   *   chain: 'SOLANA',
   *   token: 'USDC',
   * });
   */
  public async createPayout(params: {
    amount: string;
    destinationWalletAddress: string;
    chain: string;
    token: string;
  }): Promise<{
    payoutId: string;
    status: 'accepted' | 'rejected';
    message: string;
    withdrawRequestId?: number;
    requestedAmount?: string;
    reservedAmount?: string;
    createdAt: string;
    error?: string;
  }> {
    const { data } = await this.client.post('/v1/payouts', params);
    return data;
  }

  /**
   * Waits for a payment to complete by polling the 402 endpoint using a reference key.
   * The request is considered complete when the response no longer includes `referenceKey`.
   */
  public async waitForPaymentCompletion(options: {
    assets: BeepPurchaseAsset[];
    paymentReference: string;
    paymentLabel?: string;
    intervalMs?: number; // default 15s
    timeoutMs?: number; // default 5 min
    signal?: AbortSignal;
    onUpdate?: (response: PaymentRequestData | null) => void;
    onError?: (error: unknown) => void;
  }): Promise<{ paid: boolean; last?: PaymentRequestData | null }> {
    const baseIntervalMs = options.intervalMs ?? 15_000;
    let currentIntervalMs = baseIntervalMs;
    const timeoutMs = options.timeoutMs ?? 5 * 60_000;
    const deadline = Date.now() + timeoutMs;

    let last: PaymentRequestData | null = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (options.signal?.aborted) {
        return { paid: false, last };
      }
      try {
        // Call the endpoint directly to inspect status codes and normalize 402
        try {
          const resp = await this.client.post<RequestAndPurchaseAssetResponse>(
            `/v1/payment/request-payment`,
            {
              assets: options.assets,
              paymentReference: options.paymentReference,
              paymentLabel: options.paymentLabel,
              generateQrCode: false,
            },
          );
          last = resp.data.data;
        } catch (err) {
          const ax = err as AxiosError<any>;
          const status = ax.response?.status;
          // Normalize 402 (still pending)
          if (status === 402) {
            last = ax.response?.data?.data ?? null;
          } else {
            // Fatal classes: 400/401/403/404/422 ⇒ abort early
            if (status && [400, 401, 403, 404, 422].includes(status)) {
              options.onError?.(err);
              return { paid: false, last };
            }
            // Transient: 429/5xx/network ⇒ backoff and continue
            options.onError?.(err);
            // Exponential backoff with cap at 60s (do not mutate base interval)
            currentIntervalMs = Math.min(Math.ceil(currentIntervalMs * 1.5), 60_000);
            last = last ?? null;
          }
        }
        options.onUpdate?.(last);
        // Abort if server indicates expired/failed
        if (last?.status === InvoiceStatus.EXPIRED || last?.status === InvoiceStatus.FAILED) {
          return { paid: false, last };
        }
        const paid = !last?.referenceKey;
        if (paid) return { paid: true, last };
        // Reset interval on a successful round-trip
        currentIntervalMs = baseIntervalMs;
      } catch (e) {
        // Unknown error – treat as transient
        options.onError?.(e);
        currentIntervalMs = Math.min(Math.ceil(currentIntervalMs * 1.5), 60_000);
      }
      if (Date.now() >= deadline) return { paid: false, last };
      await new Promise((r) => setTimeout(r, currentIntervalMs));
    }
  }

  /**
   * Creates a payment request for purchasing assets using a two‑phase 402 flow.
   *
   * Phase 1 – Request payment (no paymentReference):
   * - Server responds with HTTP 402 Payment Required and a payload containing:
   *   referenceKey, paymentUrl (Solana Pay), optional qrCode, amount, expiresAt, status.
   * - The SDK normalizes this by returning the payload (even when status code is 402).
   * - The caller must instruct the user to pay via their wallet using paymentUrl/qrCode.
   *
   * Phase 2 – Check/complete payment (with paymentReference):
   * - Call again with the same assets and paymentReference returned in Phase 1.
   * - If payment is still pending, server may again provide the referenceKey (or return 402).
   * - When payment is complete, server will return success (no referenceKey required). In this SDK
   *   we consider the payment complete when the response does NOT include referenceKey.
   *
   * @param input - Parameters for the asset purchase request
   * @returns Payment request data or null when the input is invalid
   *
   * @example
   * // Phase 1: request
   * const req = await beep.payments.requestAndPurchaseAsset({
   *   assets: [{ assetId: 'uuid', quantity: 1 }],
   *   generateQrCode: true,
   *   paymentLabel: 'My Store'
   * });
   * // Show req.paymentUrl/req.qrCode to user; req.referenceKey identifies this payment.
   *
   * // Phase 2: poll status using the same API with the referenceKey
   * const check = await beep.payments.requestAndPurchaseAsset({
   *   assets: [{ assetId: 'uuid', quantity: 1 }],
   *   paymentReference: req?.referenceKey,
   *   generateQrCode: false
   * });
   * const isPaid = !check?.referenceKey; // When no referenceKey is returned, payment is complete
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
      // Normalize HTTP 402 Payment Required by returning its payload so callers
      // can proceed with showing the paymentUrl/qrCode and keep polling.
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
  // Note: These methods are ONLY available with BeepClient (secret API keys)
  // They do NOT work with BeepPublicClient (publishable keys)

  /**
   * Issues a payment request for streaming charges with specified asset chunks
   *
   * Creates a new streaming payment session that can be started, paused, and stopped.
   * This is the first step in setting up automatic billing for ongoing services or
   * consumption-based pricing.
   *
   * **Important Security Note**: This method requires a secret API key and is only
   * available when using `BeepClient`. It will NOT work with `BeepPublicClient` or
   * publishable keys for security reasons.
   *
   * @param payload - Payment request details including assets and merchant information
   * @returns Promise resolving to payment session identifiers
   * @throws {Error} When the request fails or authentication is invalid
   *
   * @example
   * ```typescript
   * // Only works with BeepClient (server-side)
   * const beep = new BeepClient({ apiKey: 'your_secret_api_key' });
   *
   * const paymentSession = await beep.payments.issuePayment({
   *   assetChunks: [
   *     { assetId: 'video-streaming-uuid', quantity: 1 },
   *     { assetId: 'api-calls-uuid', quantity: 100 }
   *   ],
   *   payingMerchantId: 'merchant_who_will_be_charged',
   *   invoiceId: 'optional_existing_invoice_uuid'
   * });
   *
   * console.log('Payment session created:', paymentSession.referenceKey);
   * console.log('Invoice ID for management:', paymentSession.invoiceId);
   * ```
   */
  async issuePayment(payload: IssuePaymentPayload): Promise<IssuePaymentResponse> {
    const response = await this.client.post<IssuePaymentResponse>(
      '/v1/invoices/issue-payment',
      payload,
    );
    return response.data;
  }

  /**
   * Starts an active streaming session and begins charging for asset usage
   *
   * Activates a previously issued payment request and begins billing the specified
   * merchant according to the streaming payment configuration. Once started, charges
   * will accumulate based on actual usage.
   *
   * **Important Security Note**: This method requires a secret API key and is only
   * available when using `BeepClient`. It will NOT work with `BeepPublicClient`.
   *
   * @param payload - Streaming session start details
   * @returns Promise resolving to confirmation of the started session
   * @throws {Error} When the invoice is invalid or already active
   *
   * @example
   * ```typescript
   * // Start billing for the streaming session
   * const result = await beep.payments.startStreaming({
   *   invoiceId: 'invoice_uuid_from_issuePayment'
   * });
   *
   * console.log('Streaming started for invoice:', result.invoiceId);
   * // Charges will now accumulate based on usage
   * ```
   */
  async startStreaming(payload: StartStreamingPayload): Promise<StartStreamingResponse> {
    const response = await this.client.post<StartStreamingResponse>('/v1/invoices/start', payload);
    return response.data;
  }

  /**
   * Temporarily pauses an active streaming session without terminating it
   *
   * Halts billing for a streaming session while keeping the session alive for later resumption.
   * This is useful for temporary service interruptions or when you want to control billing
   * periods precisely.
   *
   * **Important Security Note**: This method requires a secret API key and is only
   * available when using `BeepClient`. It will NOT work with `BeepPublicClient`.
   *
   * @param payload - Streaming session pause details
   * @returns Promise resolving to pause operation result
   * @throws {Error} When the invoice is not in a valid state for pausing
   *
   * @example
   * ```typescript
   * // Temporarily pause billing (can be resumed later)
   * const result = await beep.payments.pauseStreaming({
   *   invoiceId: 'active_streaming_invoice_uuid'
   * });
   *
   * if (result.success) {
   *   console.log('Streaming paused - no new charges will accumulate');
   *   // Use startStreaming() again to resume
   * }
   * ```
   */
  async pauseStreaming(payload: PauseStreamingPayload): Promise<PauseStreamingResponse> {
    const response = await this.client.post<PauseStreamingResponse>('/v1/invoices/pause', payload);
    return response.data;
  }

  /**
   * Permanently stops a streaming session and finalizes all charges
   *
   * Terminates a streaming session completely, finalizing all accumulated charges.
   * This action cannot be undone - the session cannot be restarted after stopping.
   * Use this when you're completely finished with a service or want to close out billing.
   *
   * **Important Security Note**: This method requires a secret API key and is only
   * available when using `BeepClient`. It will NOT work with `BeepPublicClient`.
   *
   * @param payload - Streaming session stop details
   * @returns Promise resolving to final session details and reference keys
   * @throws {Error} When the invoice cannot be stopped or doesn't exist
   *
   * @example
   * ```typescript
   * // Permanently stop and finalize the streaming session
   * const result = await beep.payments.stopStreaming({
   *   invoiceId: 'active_streaming_invoice_uuid'
   * });
   *
   * console.log('Session permanently stopped:', result.invoiceId);
   * console.log('All reference keys for records:', result.referenceKeys);
   * // Session cannot be restarted after this point
   * ```
   */
  async stopStreaming(payload: StopStreamingPayload): Promise<StopStreamingResponse> {
    const response = await this.client.post<StopStreamingResponse>('/v1/invoices/stop', payload);
    return response.data;
  }

  /**
   * Checks payment status for a given reference key.
   * Calls the server `/v1/invoices/check-payment-status` endpoint with an API key.
   *
   * @param params.referenceKey - The payment reference key to check
   */

  async checkPaymentStatus(params: CheckPaymentStatusPayload): Promise<CheckPaymentStatusResponse> {
    const { data } = await this.client.post('/v1/invoices/check-payment-status', params);
    return data;
  }
}
