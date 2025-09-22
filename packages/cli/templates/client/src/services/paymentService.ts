import { mcpClient } from '../mcp-client';

/**
 * Payment service for interacting with a BEEP seller over MCP.
 *
 * Note: This service assumes the remote MCP server implements BEEP tools
 * like `issuePayment`, `startStreaming`, and `stopStreaming`. If you are
 * integrating with a non-BEEP seller, tool names and shapes may differ.
 */
export class PaymentService {
  private currentRunningInvoice: string | null = null;

  async startStreamingSession(params: { apiKey: string; invoiceId: string }) {
    console.info(`Starting streaming session for invoice: ${params.invoiceId}`);
    const result = await mcpClient.startStreaming(params);
    console.info('Streaming session started successfully');
    return result;
  }

  async stopStreamingSession(params: { apiKey: string; invoiceId: string }) {
    console.info(`Stopping streaming session for invoice: ${params.invoiceId}`);
    const result = await mcpClient.stopStreaming(params);
    console.info('Streaming session stopped successfully');
    return result;
  }

  async issuePayment(params: {
    apiKey: string;
    assetChunks: Array<{ assetId: string; quantity: number }>;
    payingMerchantId: string;
  }): Promise<{ success: boolean; invoiceId?: string; referenceKey?: string; error?: unknown }> {
    console.info(`Issuing payment for ${params.assetChunks.length} asset chunks`);
    try {
      const result = await mcpClient.issuePayment(params);
      const { data, isError } = result || {};
      if (isError || !data?.invoiceId) {
        console.info('Payment failed');
        return { success: false };
      }
      const { invoiceId, referenceKey } = data as { invoiceId: string; referenceKey?: string };
      this.currentRunningInvoice = invoiceId;
      console.info('Payment issued successfully');
      return { success: true, invoiceId, referenceKey };
    } catch (error) {
      console.error('Failed to issue payment', error);
      return { success: false, error };
    }
  }
}

export const paymentService = new PaymentService();

