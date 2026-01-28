import { useMemo } from 'react';
import { BeepPublicClient } from '@beep-it/sdk-core';

interface UseBeepPublicClientParams {
  publishableKey: string;
  serverUrl?: string;
}

export const useBeepPublicClient = ({ publishableKey, serverUrl }: UseBeepPublicClientParams) => {
  return useMemo(() => {
    return new BeepPublicClient({ publishableKey, serverUrl });
  }, [publishableKey, serverUrl]);
};
