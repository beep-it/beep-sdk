import { AxiosInstance } from 'axios';
import { RequestAndPurchaseAssetResponse, SignSolanaTransactionResponse } from '../types';
import {
  PaymentRequestData,
  PaymentRequestPaidData,
  RequestAndPurchaseAssetRequestParams,
  SignSolanaTransactionData,
  SignSolanaTransactionParams,
} from '../types/payment';

export class PaymentsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async requestAndPurchaseAsset(
    input: RequestAndPurchaseAssetRequestParams,
  ): Promise<PaymentRequestData | null> {
    if (!input.paymentReference && !input.assets?.length) {
      console.error('One of paymentReference or assetIds is required');
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
}
