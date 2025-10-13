import { BeepClient } from '@beep-it/sdk-core';

export const beepClient = new BeepClient({
  apiKey: process.env.BEEP_API_KEY!,
  serverUrl: process.env.BEEP_SERVER_URL || 'https://api.justbeep.it',
});

export const getMerchantId = async () => {
  try {
    const user = await beepClient.user.getCurrentUser();

    if (!user) {
      throw new Error('BeepClient unable to fetch user');
    }

    return user.merchantId;
  } catch (error) {
    console.error('Error getting merchant ID:', error);
    return null;
  }
};
