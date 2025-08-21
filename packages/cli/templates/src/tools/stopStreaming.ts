import { z } from 'zod';
import { StopStreamingPayload, StopStreamingResponse } from '@beep/sdk-core/dist/types/payment';
import { beepClient } from './beepClient';
import { MCPToolDefinition } from '../mcp-server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { startStreaming } from './startStreaming';

export const stopStreamingInputSchema = z.object({
  invoiceId: z.string().describe('The ID of the invoice to stop streaming for.'),
  merchantId: z.string().describe('The merchant ID for authorization.'),
});

export type StopStreamingApiParams = z.infer<typeof stopStreamingInputSchema>;

export async function stopStreaming(params: StopStreamingApiParams): Promise<any> {
  const payload: StopStreamingPayload = {
    apiKey: process.env.BEEP_API_KEY!,
    invoiceId: params.invoiceId,
  };

  try {
    const response: StopStreamingResponse = await beepClient.payments.stopStreaming(payload);

    return {
      content: [
        {
          type: 'text',
          text: `Streaming stopped successfully for invoice ID: ${response.invoiceId}. Reference keys: ${response.referenceKeys.join(', ')}`,
        },
      ],
      data: response,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error stopping streaming: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      error: error,
    };
  }
}

export const stopStreamingTool: MCPToolDefinition = {
  name: 'stopStreamingTool',
  description: 'Stops the streaming for the given invoice',
  inputSchema: zodToJsonSchema(stopStreamingInputSchema),
  handler: startStreaming,
};
