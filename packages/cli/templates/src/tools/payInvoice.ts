/**
 * Skeleton: payInvoice
 *
 * Placeholder that mimics paying an invoice. Replace with SDK logic.
 */
export interface PayInvoiceResult {
  transactionSignature: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export async function payInvoice(params: Record<string, unknown>): Promise<any> {
  const { invoiceId } = params as { invoiceId?: string };
  const tx = `mock_sig_${Date.now()}`;
  const status: PayInvoiceResult['status'] = 'CONFIRMED';
  return {
    transactionSignature: tx,
    status,
    content: [
      { type: 'text', text: `Paid invoice ${invoiceId ?? '<unknown>'}. tx: ${tx}` },
    ],
  };
}
