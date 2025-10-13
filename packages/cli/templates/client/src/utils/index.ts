import { BeepClient } from '@beep-it/sdk-core';

export const beepClient = new BeepClient({
  apiKey: process.env.BEEP_API_KEY!,
  serverUrl: process.env.BEEP_SERVER_URL || 'https://api.justbeep.it',
});

export const getMerchantId = async () => {
  const user = await beepClient.user.getCurrentUser();
  return user.merchantId;
};
