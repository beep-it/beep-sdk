import { useMutation } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';
import { CheckEmailVerificationRequest } from '../../../core/src/types/public';

export const useCheckEmailVerification = ({
  publishableKey,
  serverUrl,
}: {
  publishableKey: string;
  serverUrl?: string;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: CheckEmailVerificationRequest) => {
      return client.widget.checkEmailVerification(data);
    },
    onError: (error) => {
      console.error('Check email verification failed:', error);
    },
  });

  return {
    checkEmailVerification: mutateAsync,
    isPending,
    error,
  };
};
