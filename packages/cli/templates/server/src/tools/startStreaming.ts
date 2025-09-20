import {
  StartStreamingPayload,
  StartStreamingResponse,
} from '@beep-it/sdk-core/dist/types/payment';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../types';
import { beepClient } from './beepSDKClient';

const startStreamingInputSchema = z.object({
  invoiceId: z.string().describe('The ID of the invoice to start streaming for.'),
  merchantId: z.string().describe('The merchant ID for authorization.'),
});

export type StartStreamingApiParams = z.infer<typeof startStreamingInputSchema>;

export async function startStreaming(params: StartStreamingApiParams): Promise<any> {
  const payload: StartStreamingPayload = {
    apiKey: process.env.BEEP_API_KEY!,
    invoiceId: params.invoiceId,
  };

  try {
    const response: StartStreamingResponse = await beepClient.payments.startStreaming(payload);

    return {
      content: [
        {
          type: 'text',
          text: `Streaming started successfully for invoice ID: ${response.invoiceId}`,
        },
      ],
      data: response,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error starting streaming: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      error: error,
    };
  }
}

export const startStreamingTool: MCPToolDefinition = {
  name: 'startStreamingTool',
  description: 'Starts the streaming for the given invoice',
  inputSchema: zodToJsonSchema(startStreamingInputSchema),
  handler: startStreaming,
};
