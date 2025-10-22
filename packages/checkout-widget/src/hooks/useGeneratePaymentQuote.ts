import { useQuery } from '@tanstack/react-query';
import { useBeepPublicClient } from './useBeepPublicClient';
import { PayWayCode } from '../../../core/src/types/cash-payment';
import { GeneratePaymentQuoteResponse } from '../../../core/src/types/public';

const FIFTEEN_SECONDS_MS = 15000;

export const useGeneratePaymentQuote = ({
  publishableKey,
  serverUrl,
  amount,
  walletAddress,
  payWayCode,
}: {
  publishableKey: string;
  serverUrl?: string;
  amount: string;
  walletAddress: string;
  payWayCode?: PayWayCode;
}) => {
  const client = useBeepPublicClient({ publishableKey, serverUrl });

  return useQuery<GeneratePaymentQuoteResponse>({
    queryKey: ['generate-payment-quote', amount, walletAddress, payWayCode, publishableKey],
    queryFn: async () => {
      return client.widget.generatePaymentQuote({
        amount,
        walletAddress,
        payWayCode,
      });
    },
    enabled: !!amount && !!walletAddress,
    refetchInterval: FIFTEEN_SECONDS_MS, // Refresh every 15 seconds
    staleTime: FIFTEEN_SECONDS_MS, // Disable caching to always get fresh quotes
  });
};
