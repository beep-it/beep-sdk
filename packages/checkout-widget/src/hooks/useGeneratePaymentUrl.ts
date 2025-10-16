import { useMutation } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';

interface GeneratePaymentUrlParams {
  amount: string;
  walletAddress: string;
  reference: string;
}

export const useGeneratePaymentUrl = ({
  publishableKey,
  serverUrl,
}: {
  publishableKey: string;
  serverUrl?: string;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: GeneratePaymentUrlParams) => {
      return client.widget.generateCashPaymentUrl(data);
    },
    onError: (error) => {
      console.error('Generation for TopUp payment url failed:', error);
    },
  });

  return {
    generateCahPaymentUrl: mutateAsync,
    isPending,
    error,
  };
};
