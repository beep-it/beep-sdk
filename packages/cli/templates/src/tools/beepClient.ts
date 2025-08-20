import { BeepClient } from '@beep/sdk-core';

if (!process.env.BEEP_API_KEY) {
  throw new Error('BEEP_API_KEY is not configured in the .env file.');
}

export const beepClient = new BeepClient({
  apiKey: process.env.BEEP_CLIENT_ID!,
  serverUrl: process.env.BEEP_URL,
});
