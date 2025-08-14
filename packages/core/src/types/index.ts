export * from './invoice';
export * from './product';
export * from './token';
import { PaymentRequestData, SignSolanaTransactionData } from './payment';

export interface BeepResponse {
  data: unknown;
  status: number;
}

export interface RequestAndPurchaseAssetResponse extends BeepResponse {
  data: PaymentRequestData;
}

export interface SignSolanaTransactionResponse extends BeepResponse {
  data: SignSolanaTransactionData;
}
