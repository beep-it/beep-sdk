import { BeepClient } from '@beep/sdk-core';

export interface RequestAndPurchaseAssetRequestParams {
  /** Array of asset IDs to request and purchase */
  assetIds?: string[];
  /** Reference identifier for the payment transaction */
  paymentReference?: string;
}

export async function requestAndPurchaseAsset(
  params: RequestAndPurchaseAssetRequestParams,
): Promise<any> {
  const { assetIds, paymentReference } = (params || {}) as {
    assetIds?: string[];
    paymentReference?: string;
  };

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
  // Not currently supported directly by the SDK. We need two capabilities:
  // [SDK-LOGIC-NEEDED] BeepClient.validatePayment(referenceKey: string): Promise<{ isValid: boolean; invoiceId?: string }>
  // [SDK-LOGIC-NEEDED] BeepClient.getPaidResource(resourceId: string): Promise<any>
  // For now, return a structured note describing the missing pieces.

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
