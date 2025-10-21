import { useMutation } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';
import { GenerateOTPRequest } from '../../../core/src/types/public';

export const useGenerateOTP = ({
  publishableKey,
  serverUrl,
}: {
  publishableKey: string;
  serverUrl?: string;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: GenerateOTPRequest) => {
      return client.widget.generateOTP(data);
    },
    onError: (error) => {
      console.error('Check email verification failed:', error);
    },
  });

  return {
    generateOTP: mutateAsync,
    isPending,
    error,
  };
};
