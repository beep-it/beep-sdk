/**
 * Skeleton: getTransactionStatus
 *
 * Returns a mock pending status. Replace with SDK invoice/tx status lookup.
 */
export async function getTransactionStatus(params: Record<string, unknown>): Promise<any> {
  const { transactionSignature } = params as { transactionSignature?: string };
  return {
    status: 'pending',
    transactionHash: transactionSignature ?? 'mock_hash',
    timestamp: new Date().toISOString(),
    content: [
      { type: 'text', text: `Transaction ${transactionSignature ?? 'unknown'} pending (mock).` },
    ],
  };
}
