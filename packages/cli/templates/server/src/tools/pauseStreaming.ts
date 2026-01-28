import { PauseStreamingPayload } from '@beep-it/sdk-core/dist/types/payment';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../types';
import { beepClient } from './beepSDKClient';

const pauseStreamingInputSchema = z.object({
  invoiceId: z.string().describe('The ID of the invoice to pause streaming for.'),
  merchantId: z.string().describe('The merchant ID for authorization.'),
});

export type PauseStreamingApiParams = z.infer<typeof pauseStreamingInputSchema>;

export async function pauseStreaming(params: PauseStreamingApiParams): Promise<any> {
  const invoiceId = params.invoiceId;

  const payload: PauseStreamingPayload = {
    invoiceId,
  };

  try {
    const response = await beepClient.payments.pauseStreaming(payload);

    return {
      content: [
        {
          type: 'text',
          text: `Streaming ${response.success ? 'paused successfully' : 'failed to pause'} for invoice ID: ${invoiceId}`,
        },
      ],
      data: response,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error pausing streaming: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      error: error,
    };
  }
}

export const pauseStreamingTool: MCPToolDefinition = {
  name: 'pauseStreamingTool',
  description: 'Pauses the streaming for the given invoice',
  inputSchema: zodToJsonSchema(pauseStreamingInputSchema),
  handler: pauseStreaming,
};
