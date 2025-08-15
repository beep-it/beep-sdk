import { BeepClient } from '@beep/sdk-core';
/**
 * Skeleton: signSolanaTokenTransaction
 *
 * Returns a mock token transaction signing result. Replace with SDK token tx handling.
 */

export interface SignSolanaTransactionParams {
  senderAddress: string;
  recipientAddress: string;
  tokenMintAddress: string;
  amount: number;
  decimals: number;
}

export async function signSolanaTransaction(params: SignSolanaTransactionParams): Promise<any> {
  const apiKey = process.env.BEEP_API_KEY;
  if (!apiKey) {
    return { error: 'BEEP_API_KEY is not configured in the .env file.' };
  }

  const client = new BeepClient({ apiKey });

  const transactionResult = await client.payment.signSolanaTransaction({
    senderAddress: params.senderAddress,
    recipientAddress: params.recipientAddress,
    tokenMintAddress: params.tokenMintAddress,
    amount: params.amount,
    decimals: params.decimals,
  });

  return { content: [{ type: 'text', text: JSON.stringify(transactionResult) }] };
}
