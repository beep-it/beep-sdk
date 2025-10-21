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

    let statusText = 'Payment pending';
    switch (response?.status) {
      case 'PENDING':
      case 'IN_PROGRESS':
        statusText = 'Payment pending';
        break;
      case 'CANCELED':
        statusText = 'Payment canceled';
        break;
      case 'FAILED':
        statusText = 'Payment failed';
        break;
      case 'COMPLETED':
        statusText = 'Payment confirmed';
        break;
      case 'NOT_FOUND':
        statusText = 'Payment reference not found';
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: statusText,
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
