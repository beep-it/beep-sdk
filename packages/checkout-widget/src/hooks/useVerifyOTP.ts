import { useMutation } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';
import { VerifyOTPRequest } from '../../../core/src/types/public';

export const useVerifyOTP = ({
  publishableKey,
  serverUrl,
}: {
  publishableKey: string;
  serverUrl?: string;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: VerifyOTPRequest) => {
      return client.widget.verifyOTP(data);
    },
    onError: (error) => {
      console.error('Check email verification failed:', error);
    },
  });

  return {
    verifyOTP: mutateAsync,
    isPending,
    error,
  };
};
