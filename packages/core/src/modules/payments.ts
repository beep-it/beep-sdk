import { AxiosError, AxiosInstance } from 'axios';
import { RequestAndPurchaseAssetResponse, SignSolanaTransactionResponse } from '../types';
import { InvoiceStatus } from '../types/invoice';
import {
  BeepPurchaseAsset,
  PaymentRequestData,
  RequestAndPurchaseAssetRequestParams,
  SignSolanaTransactionData,
  SignSolanaTransactionParams,
} from '../types/payment';

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
}
