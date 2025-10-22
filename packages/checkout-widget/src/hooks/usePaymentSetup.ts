import {
  BeepPurchaseAsset,
  CreateProductPayload,
  EphemeralItem,
  PublicPaymentSessionResponse,
} from '@beep-it/sdk-core';
import { useQuery } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';

interface PaymentSetupData {
  qrCode: string | null;
  referenceKey: string | null;
  paymentUrl: string | null;
  paymentLabel?: string;
  processedAssets: BeepPurchaseAsset[];
  totalAmount: number;
  destinationAddress: string;
}

interface UsePaymentSetupParams {
  assets: (CreateProductPayload | BeepPurchaseAsset)[];
  publishableKey: string;
  serverUrl?: string;
  paymentLabel?: string;
}

export const usePaymentSetup = ({
  assets,
  publishableKey,
  serverUrl,
  paymentLabel,
}: UsePaymentSetupParams) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  return useQuery<PaymentSetupData>({
    queryKey: ['payment-setup', JSON.stringify(assets), publishableKey, serverUrl],
    queryFn: async () => {
      const publicAssets: (BeepPurchaseAsset | EphemeralItem)[] = assets.map((a) => {
        if ('name' in a && 'price' in a) {
          const rawPrice: unknown = (a as any).price;
          const priceStr = typeof rawPrice === 'number' ? rawPrice.toFixed(2) : String(rawPrice);
          const item: EphemeralItem = {
            name: (a as any).name,
            price: priceStr,
            quantity: (a as any).quantity || 1,
            description: (a as any).description || undefined,
          };
          return item;
        }
        return {
          assetId: (a as BeepPurchaseAsset).assetId,
          quantity: (a as BeepPurchaseAsset).quantity,
        };
      });

      const resp: PublicPaymentSessionResponse = await client.widget.createPaymentSession({
        assets: publicAssets,
        paymentLabel,
        generateQrCode: true,
      });

      return {
        qrCode: resp.qrCode || null,
        referenceKey: resp.referenceKey || null,
        paymentUrl: resp.paymentUrl || null,
        processedAssets: publicAssets.filter(
          (a): a is BeepPurchaseAsset => 'assetId' in a,
        ) as BeepPurchaseAsset[],
        totalAmount: resp.amount ? parseFloat(resp.amount) : 0,
        destinationAddress: resp.destinationAddress,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
