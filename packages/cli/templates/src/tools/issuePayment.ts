import { z } from 'zod';
import { IssuePaymentPayload } from '@beep/sdk-core/dist/types/payment';
import { beepClient } from './beepClient';
import { MCPToolDefinition } from '../mcp-server';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const issuePaymentApiSchema = z.object({
  assetChunks: z
    .array(
      z
        .object({
          assetId: z.string().describe('The ID of the asset being streamed.'),
          quantity: z.number().describe('The quantity of the asset chunk.'),
          priceId: z.string().optional().describe('The quantity of the asset chunk.'),
        })
        .describe('Details of the asset chunk being streamed.'),
    )
    .describe('Asset chunks to purchase'),
  payingMerchantId: z.string().describe('The Paying Merchant ID'),
  invoiceId: z.string().optional().describe('The invoiceId to charge on'),
});

export type IssuePaymentApiParams = z.infer<typeof issuePaymentApiSchema>;

export async function issuePayment(params: IssuePaymentApiParams) {
  const { assetChunks, payingMerchantId, invoiceId } = params as {
    assetChunks: Array<{ assetId: string; quantity: number }>;
    payingMerchantId: string;
    invoiceId?: string;
  };

  const payload: IssuePaymentPayload = {
    apiKey: process.env.BEEP_API_KEY!,
    assetChunks,
    payingMerchantId,
    invoiceId,
  };

  try {
    const response = await beepClient.payments.issuePayment(payload);

    return {
      content: [
        {
          type: 'text',
          text: `Payment issued successfully. Invoice ID: ${response.invoiceId}, Reference key: ${response.referenceKey}`,
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
          text: `Error issuing payment: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      data: error,
      isError: true,
    };
  }
}

export const issuePaymentTool: MCPToolDefinition = {
  name: 'issuePayment',
  description: 'Issue payment invoice and charge if assets are provided.',
  inputSchema: zodToJsonSchema(issuePaymentApiSchema),
  handler: issuePayment,
};
