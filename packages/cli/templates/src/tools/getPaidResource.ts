import { BeepClient, SupportedToken } from '@beep/sdk-core';

/**
 * getPaidResource
 *
 * Mirrors the production tool's HTTP 402 flow using only SDK features.
 * - If no paymentReference is provided, we request a payment via SDK and return payment details.
 * - If paymentReference is provided, we need to validate it and fetch the resource.
 *   That requires capabilities not currently exposed in the SDK, so we annotate them with [SDK-LOGIC-NEEDED].
 */
export async function getPaidResource(params: Record<string, unknown>): Promise<any> {
  const {
    resourceId,
    paymentReference,
    amount: rawAmount,
    token: rawToken,
    description: rawDescription,
    serverUrl,
  } = (params || {}) as {
    resourceId?: string;
    paymentReference?: string;
    amount?: number; // decimal amount in USD-equivalent
    token?: keyof typeof SupportedToken; // 'USDT' | 'USDC' etc.
    description?: string;
    serverUrl?: string; // optional override for API base URL
  };

  const apiKey = process.env.BEEP_API_KEY;
  if (!apiKey) {
    return { error: 'BEEP_API_KEY is not configured in the .env file.' };
  }

  // Default request metadata
  const amount = typeof rawAmount === 'number' ? rawAmount : 10; // fallback to 10
  const token = rawToken && SupportedToken[rawToken] ? SupportedToken[rawToken] : SupportedToken.USDT;
  const description = rawDescription || (resourceId ? `Payment for resource ${resourceId}` : 'Payment');

  const client = new BeepClient({ apiKey, serverUrl });

  // Branch 1: No paymentReference -> initiate payment request via SDK
  if (!paymentReference) {
    try {
      const invoice = await client.requestPayment({
        amount,
        token,
        description,
        // payerType may be customized by callers when needed; omitted by default
      });

      // Return payment instructions similar to the 402 pattern
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message:
                  'Payment required. Please present the paymentUrl/QR to the user and, once paid, call this tool again with the referenceKey as paymentReference.',
                resourceId: resourceId ?? null,
                paymentUrl: invoice.paymentUrl,
                referenceKey: invoice.referenceKey,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to create payment request: ${errorMessage}` };
    }
  }

  // Branch 2: paymentReference provided -> validate and return resource
  // Not currently supported directly by the SDK. We need two capabilities:
  // [SDK-LOGIC-NEEDED] BeepClient.validatePayment(referenceKey: string): Promise<{ isValid: boolean; invoiceId?: string }>
  // [SDK-LOGIC-NEEDED] BeepClient.getPaidResource(resourceId: string): Promise<any>
  // For now, return a structured note describing the missing pieces.
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message:
              'paymentReference handling requires additional SDK support to validate the payment and fetch the resource.',
            steps: [
              'Call SDK method to validate the paymentReference and ensure the invoice is paid.',
              'If valid, allow for access to paid resource',
            ],
            notes: [
              '[SDK-LOGIC-NEEDED] validatePayment(referenceKey) to confirm settlement.',
              '[SDK-LOGIC-NEEDED] getPaidResource(resourceId) or equivalent to return the actual content.',
            ],
            provided: {
              resourceId: resourceId ?? null,
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
