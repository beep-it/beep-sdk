import { BeepClient } from '@beep/sdk-core';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../mcp-server';

// Zod schema for request and purchase asset
export const requestAndPurchaseAssetSchema = z.object({
  assetIds: z.array(z.string()).optional().describe('Array of asset IDs to request and purchase'),
  paymentReference: z.string().optional().describe('Reference identifier for the payment transaction'),
});

// Auto-generated TypeScript type
export type RequestAndPurchaseAssetRequestParams = z.infer<typeof requestAndPurchaseAssetSchema>;

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPErrorResponse {
  error: string;
}

export async function requestAndPurchaseAsset(
  params: RequestAndPurchaseAssetRequestParams,
): Promise<MCPResponse | MCPErrorResponse> {
  const { assetIds, paymentReference } = params;

  const apiKey = process.env.BEEP_API_KEY;
  if (!apiKey) {
    return { error: 'BEEP_API_KEY is not configured in the .env file.' };
  }

  const client = new BeepClient({ apiKey });

  // Branch 1: No paymentReference -> initiate payment request via SDK
  if (!paymentReference) {
    try {
      const result = await client.payments.requestAndPurchaseAsset({
        assetIds,
        paymentReference,
      });

      // Return structured 402 payment required response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'payment_required',
                payment: {
                  url: result.paymentUrl,
                  amount: result.amount,
                  token: result.token,
                  reference: result.referenceKey,
                  qrCode: result.qrCode,
                },
                instructions: 'Complete payment then retry with paymentReference parameter',
              },
              null,
              2,
            ),
          },
        ],
        isError: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to create payment request: ${errorMessage}` };
    }
  }

  // Branch 2: paymentReference provided -> validate and return resource
  const result = await client.payments.requestAndPurchaseAsset({
    assetIds,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            status: 'payment_required',
            payment: {
              url: result.paymentUrl,
              amount: result.amount,
              token: result.token,
              reference: result.referenceKey,
              qrCode: result.qrCode,
            },
            instructions: 'Complete payment then retry with paymentReference parameter',
            steps: [
              'Call SDK method to validate the paymentReference and ensure the invoice is paid.',
              'If valid, allow for access to paid resource',
            ],
            notes: [
              '[IMPORTANT- NEEDS IMPLEMENTATION] getPaidResource(resourceId) or equivalent to return the actual content.',
            ],
            provided: {
              assetIds: assetIds ?? null,
              paymentReference,
            },
          },
          null,
          2,
        ),
      },
    ],
  };
}

/**
 * MCP Tool Definition with Zod schema
 */
export const requestAndPurchaseAssetTool: MCPToolDefinition = {
  name: 'requestAndPurchaseAsset',
  description: 'Request and purchase assets using HTTP 402 Payment Required flow',
  inputSchema: zodToJsonSchema(requestAndPurchaseAssetSchema),
  handler: requestAndPurchaseAsset,
};
