import { useQuery } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';

interface UsePaymentStatusParams {
  referenceKey: string | null;
  publishableKey: string;
  serverUrl?: string;
  enabled: boolean;
}

export const usePaymentStatus = ({
  referenceKey,
  publishableKey,
  serverUrl,
  enabled,
}: UsePaymentStatusParams) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  return useQuery({
    queryKey: ['payment-status', referenceKey],
    queryFn: async () => {
      if (!referenceKey) return false;
      const result = await client.widget.getPaymentStatus(referenceKey);
      return Boolean(result?.paid);
    },
    enabled: enabled && !!referenceKey,
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: true,
    retry: false, // Don't retry failed polling requests
  });
};
