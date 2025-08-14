/**
 * Skeleton: getPaymentWidget
 *
 * Returns a minimal HTML snippet (placeholder). Replace with SDK-powered widget.
 */
export async function getPaymentWidget(_params: Record<string, unknown>): Promise<any> {
  const html = `<!DOCTYPE html><html><body><h3>BEEP Payment Widget (Mock)</h3></body></html>`;
  return { content: [{ type: 'text', text: html }] };
}
