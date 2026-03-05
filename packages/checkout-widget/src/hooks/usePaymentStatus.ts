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
      if (!referenceKey) {
        return null;
      }
      return client.widget.getPaymentStatus(referenceKey);
    },
    enabled: enabled && !!referenceKey,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if status is 'failed' or 'pending', or if payment is complete
      if (data?.paid || data?.status === 'failed' || data?.status === 'pending') {
        return false;
      }
      return 15000; // Poll every 15 seconds
    },
    refetchIntervalInBackground: true,
    retry: false, // Don't retry failed polling requests
  });
};
