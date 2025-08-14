/**
 * Skeleton: signSolanaTransaction
 *
 * Returns a mock signed transaction and pending status. Replace with SDK wallet provider.
 */
export async function signSolanaTransaction(params: Record<string, unknown>): Promise<any> {
  const { transactionUri } = params as { transactionUri?: string };
  const transactionId = `tx_${Date.now()}`;
  const signedTransaction = transactionUri ?? 'mock_signed_tx';
  return {
    status: 'pending',
    transactionId,
    signedTransaction,
    content: [
      { type: 'text', text: `Transaction ${transactionId} signed (mock). Status: pending.` },
    ],
  };
}
