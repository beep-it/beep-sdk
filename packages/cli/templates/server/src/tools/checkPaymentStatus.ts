import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../types';
import { beepClient } from './beepSDKClient';

export const checkPaymentStatusSchema = z.object({
  referenceKey: z.string().min(1).describe('Reference key for the pending payment'),
  apiKey: z.string().min(1).describe('Secret API key authorized to query status'),
});

export type CheckPaymentStatusParams = z.infer<typeof checkPaymentStatusSchema>;

export async function checkPaymentStatus(params: CheckPaymentStatusParams) {
  try {
    const response = await beepClient.payments.checkPaymentStatus(params);
    const paid = !!response?.paid;
    return {
      content: [
        {
          type: 'text',
          text: paid ? 'Payment confirmed.' : 'Payment pending.',
        },
      ],
      data: response,
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error checking payment status: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      data: error,
      isError: true,
    };
  }
}

export const checkPaymentStatusTool: MCPToolDefinition = {
  name: 'checkPaymentStatus',
  description: 'Check the status of a payment using a reference key.',
  inputSchema: zodToJsonSchema(checkPaymentStatusSchema),
  handler: checkPaymentStatus,
};

