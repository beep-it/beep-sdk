import { useQuery } from '@tanstack/react-query';
import { BeepPurchaseAsset } from '@beep-it/sdk-core';
import { useBeepClient } from './useBeepClient';

interface UsePaymentStatusParams {
  referenceKey: string | null;
  processedAssets: BeepPurchaseAsset[];
  apiKey: string;
  serverUrl?: string;
  enabled: boolean;
}

export const usePaymentStatus = ({ 
  referenceKey, 
  processedAssets, 
  apiKey, 
  serverUrl, 
  enabled 
}: UsePaymentStatusParams) => {
  const client = useBeepClient({ apiKey, serverUrl });

  return useQuery({
    queryKey: ['payment-status', referenceKey],
    queryFn: async () => {
      if (!referenceKey || !processedAssets.length) return null;
      
      const response = await client.payments.requestAndPurchaseAsset({
        assets: processedAssets,
        paymentReference: referenceKey,
        generateQrCode: false,
      });
      
      // Return true if payment complete (no referenceKey), false if still pending
      return !response?.referenceKey;
    },
    enabled: enabled && !!referenceKey && !!processedAssets.length,
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: true,
    retry: false, // Don't retry failed polling requests
  });
};