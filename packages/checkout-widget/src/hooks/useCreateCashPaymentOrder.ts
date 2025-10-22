import { useMutation } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';
import { CreateCashPaymentOrderRequest } from '../../../core/src/types/public';

export const useCreateCashPaymentOrder = ({
  publishableKey,
  serverUrl,
}: {
  publishableKey: string;
  serverUrl?: string;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: CreateCashPaymentOrderRequest) => {
      return client.widget.createCashPaymentOrder(data);
    },
    onError: (error) => {
      console.error('Creation of cash payment order failed:', error);
    },
  });

  return {
    createCashPaymentOrder: mutateAsync,
    isPending,
    error,
  };
};
