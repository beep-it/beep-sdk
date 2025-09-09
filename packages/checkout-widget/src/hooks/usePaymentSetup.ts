import { useQuery } from '@tanstack/react-query';
import { BeepPurchaseAsset, CreateProductPayload } from '@beep-it/sdk-core';
import { useBeepClient } from './useBeepClient';

interface PaymentSetupData {
  qrCode: string | null;
  referenceKey: string | null;
  paymentUrl: string | null;
  processedAssets: BeepPurchaseAsset[];
}

interface UsePaymentSetupParams {
  assets: (CreateProductPayload | BeepPurchaseAsset)[];
  apiKey: string;
  serverUrl?: string;
}

export const usePaymentSetup = ({ assets, apiKey, serverUrl }: UsePaymentSetupParams) => {
  const client = useBeepClient({ apiKey, serverUrl });

  const isCreateProductPayload = (asset: CreateProductPayload | BeepPurchaseAsset): asset is CreateProductPayload => {
    return 'name' in asset && 'price' in asset;
  };

  const processAssets = async (): Promise<BeepPurchaseAsset[]> => {
    const processedAssets: BeepPurchaseAsset[] = [];

    for (const asset of assets) {
      if (isCreateProductPayload(asset)) {
        try {
          const product = await client.products.createProduct(asset);
          processedAssets.push({ assetId: product.id, quantity: 1 });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to create product "${asset.name}": ${error.message}`
              : `Failed to create product "${asset.name}": Unknown error`;
          throw new Error(errorMessage);
        }
      } else {
        processedAssets.push(asset);
      }
    }

    return processedAssets;
  };

  return useQuery<PaymentSetupData>({
    queryKey: ['payment-setup', JSON.stringify(assets), apiKey, serverUrl],
    queryFn: async () => {
      const processedAssets = await processAssets();
      
      const paymentResponse = await client.payments.requestAndPurchaseAsset({
        assets: processedAssets,
        generateQrCode: true,
      });

      return {
        qrCode: paymentResponse?.qrCode || null,
        referenceKey: paymentResponse?.referenceKey || null,
        paymentUrl: paymentResponse?.paymentUrl || null,
        processedAssets,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};