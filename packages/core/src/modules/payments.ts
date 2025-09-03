import { AxiosInstance } from 'axios';
import { RequestAndPurchaseAssetResponse, SignSolanaTransactionResponse } from '../types';
import {
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
