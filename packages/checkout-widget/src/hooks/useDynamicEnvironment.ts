import { useQuery } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';

interface UseDynamicEnvironmentParams {
  publishableKey: string;
  serverUrl?: string;
}

/**
 * Hook to fetch Dynamic Wallet environment ID from the backend
 *
 * This hook fetches the Dynamic Wallet environment ID from the backend
 * instead of hardcoding it or relying on environment variables.
 *
 * @param publishableKey - BEEP publishable key for authentication
 * @param serverUrl - Optional custom server URL
 * @returns Query result containing the environment ID
 */
export const useDynamicEnvironment = ({
  publishableKey,
  serverUrl,
}: UseDynamicEnvironmentParams) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  return useQuery<string>({
    queryKey: ['dynamic-environment-id', publishableKey, serverUrl],
    queryFn: async () => {
      const response = await client.widget.getDynamicEnv();
      return response?.environmentId;
    },
    staleTime: Infinity,
    retry: 1,
  });
};
