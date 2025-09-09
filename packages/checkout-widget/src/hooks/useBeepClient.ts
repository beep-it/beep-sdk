import { useMemo } from 'react';
import { BeepClient } from '@beep-it/sdk-core';

interface UseBeepClientParams {
  apiKey: string;
  serverUrl?: string;
}

export const useBeepClient = ({ apiKey, serverUrl }: UseBeepClientParams) => {
  return useMemo(() => {
    return new BeepClient({ apiKey, serverUrl });
  }, [apiKey, serverUrl]);
};